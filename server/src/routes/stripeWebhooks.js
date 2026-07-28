const express = require('express');
const { config } = require('../config');
const { getStripe } = require('../stripe');
const {
  markInvoicePaid,
  findInvoiceByCheckoutSession,
  getInvoiceById,
  recomputeProjectBillingStatus,
  maybeActivateProject,
  findHostingInvoiceForProject,
} = require('../billing/invoices');
const {
  claimWebhookEvent,
  findProjectForSubscription,
  findProjectBySubscriptionId,
  syncProjectFromStripeSubscription,
} = require('../billing/subscriptionSync');
const { getDb } = require('../db');

const router = express.Router();

async function retrieveSubscription(stripe, subscriptionRef) {
  if (!subscriptionRef) return null;
  const id = typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id;
  if (!id) return null;
  try {
    return await stripe.subscriptions.retrieve(id, {
      expand: ['items.data.price'],
    });
  } catch (err) {
    console.error('Failed to retrieve subscription', id, err.message);
    return null;
  }
}

function customerIdFromObject(obj) {
  if (!obj) return null;
  if (typeof obj.customer === 'string') return obj.customer;
  return obj.customer?.id || null;
}

router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!config.stripeWebhookSecret || !config.stripeSecretKey) {
      return res.status(503).send('Stripe webhook not configured.');
    }

    const stripe = getStripe();
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        config.stripeWebhookSecret
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const database = getDb();

    if (!claimWebhookEvent(event.id, event.type, database)) {
      return res.json({ received: true, duplicate: true });
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoiceId || session.client_reference_id;
        const projectId = session.metadata?.projectId;
        const kind = session.metadata?.kind;

        let invoice = invoiceId ? getInvoiceById(invoiceId, database) : null;
        if (!invoice && session.id) {
          invoice = findInvoiceByCheckoutSession(session.id, database);
        }

        if (invoice && invoice.status !== 'paid' && kind !== 'hosting') {
          markInvoicePaid(
            invoice.id,
            {
              checkoutSessionId: session.id,
              paymentIntentId:
                typeof session.payment_intent === 'string' ? session.payment_intent : null,
            },
            database
          );
        }

        // Hosting Checkout: sync full subscription state from Stripe
        if (kind === 'hosting' || session.mode === 'subscription') {
          const pid = projectId || invoice?.project_id;
          const subscription = await retrieveSubscription(stripe, session.subscription);
          if (pid && subscription) {
            // Ensure metadata carries project for later portal events
            if (!subscription.metadata?.projectId && pid) {
              try {
                await stripe.subscriptions.update(subscription.id, {
                  metadata: { ...subscription.metadata, projectId: pid },
                });
              } catch (err) {
                console.error('Failed to stamp subscription metadata', err.message);
              }
            }
            syncProjectFromStripeSubscription(pid, subscription, database);
            const hostingInv =
              (invoice?.kind === 'hosting' ? invoice : null) ||
              findHostingInvoiceForProject(pid, database);
            if (hostingInv && hostingInv.status !== 'paid') {
              markInvoicePaid(
                hostingInv.id,
                {
                  checkoutSessionId: session.id,
                  paymentIntentId:
                    typeof session.payment_intent === 'string' ? session.payment_intent : null,
                },
                database
              );
            }
          } else if (pid) {
            // Subscription not yet available — mark invoice paid and set sub id if present
            const subId =
              typeof session.subscription === 'string' ? session.subscription : null;
            if (subId) {
              database
                .prepare(
                  `UPDATE projects SET
                     stripe_subscription_id = ?,
                     hosting_status = 'active',
                     updated_at = datetime('now')
                   WHERE id = ?`
                )
                .run(subId, pid);
            }
            const hostingInv = findHostingInvoiceForProject(pid, database);
            if (hostingInv && hostingInv.status !== 'paid') {
              markInvoicePaid(
                hostingInv.id,
                { checkoutSessionId: session.id },
                database
              );
            }
            recomputeProjectBillingStatus(pid, database, { preserveHostingStatus: true });
          }
        }

        const pid = projectId || invoice?.project_id;
        if (pid) {
          recomputeProjectBillingStatus(pid, database, { preserveHostingStatus: true });
          maybeActivateProject(pid, database);
        }
      }

      if (
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        let subscription = event.data.object;
        if (event.type !== 'customer.subscription.deleted') {
          const fresh = await retrieveSubscription(stripe, subscription.id);
          if (fresh) subscription = fresh;
        }

        const project = findProjectForSubscription(subscription, database);
        if (project) {
          if (event.type === 'customer.subscription.deleted') {
            syncProjectFromStripeSubscription(project.id, null, database);
          } else {
            syncProjectFromStripeSubscription(project.id, subscription, database);
          }
        }
      }

      if (event.type === 'invoice.payment_failed' || event.type === 'invoice.paid') {
        const stripeInvoice = event.data.object;
        const subId =
          typeof stripeInvoice.subscription === 'string' ? stripeInvoice.subscription : null;
        if (subId) {
          const subscription = await retrieveSubscription(stripe, subId);
          let project =
            (subscription && findProjectForSubscription(subscription, database)) ||
            findProjectBySubscriptionId(subId, database);

          if (!project && customerIdFromObject(stripeInvoice)) {
            // fall through via subscription finder customer path
            project = findProjectForSubscription(
              { id: subId, customer: customerIdFromObject(stripeInvoice), metadata: {} },
              database
            );
          }

          if (project && subscription) {
            syncProjectFromStripeSubscription(project.id, subscription, database);
            if (event.type === 'invoice.paid') {
              const hostingInv = findHostingInvoiceForProject(project.id, database);
              if (hostingInv && hostingInv.status !== 'paid') {
                markInvoicePaid(
                  hostingInv.id,
                  { stripeInvoiceId: stripeInvoice.id },
                  database
                );
              }
            }
          } else if (project && event.type === 'invoice.payment_failed') {
            database
              .prepare(
                `UPDATE projects SET hosting_status = 'overdue', updated_at = datetime('now') WHERE id = ?`
              )
              .run(project.id);
            recomputeProjectBillingStatus(project.id, database, { preserveHostingStatus: true });
          }
        }
      }

      if (event.type === 'checkout.session.expired') {
        // No-op beyond idempotency claim — checkout session ids can stay for audit.
      }
    } catch (err) {
      console.error('Stripe webhook handler error:', err);
      // Delete claim so Stripe can retry
      try {
        database.prepare('DELETE FROM stripe_webhook_events WHERE event_id = ?').run(event.id);
      } catch {
        // ignore
      }
      return res.status(500).json({ ok: false });
    }

    return res.json({ received: true });
  }
);

module.exports = router;
