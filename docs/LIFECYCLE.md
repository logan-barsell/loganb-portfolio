# Project lifecycle

Canonical flow for inquiries that become client projects.

```text
Inquiry
  → Proposal (draft → sent)
  → Accept / Decline / Revision  ← one living proposal per inquiry
  → Project (on hold)            ← accept creates the project
    → Project started (active)   ← work begins
    → Project completed          ← build finished
    → Ready for launch           ← hosting unlocked (requires completed)
    → Client starts hosting      ← Stripe subscription in portal
```

Statuses on `projects`: `on_hold` → `active` → `completed` (also `cancelled`).  
`ready_for_launch_at` is a separate unlock flag, not a status.

## Domain model: client vs business

- **Client** = the person (`name`, `email`, `phone`). Email is unique.
- **Business name** is **engagement-scoped** on the inquiry (and thus the proposal/project that flows from it). Prefer `inquiry.business_name` in emails, share UI, project naming, and admin lists.
- `clients.business_name` is a denormalized first-touch value for client-list search only — it is **not** overwritten on later inquiries and is **not** the canonical business for a project.
- One client may have multiple projects via multiple inquiries (different businesses or packages).

## Proposal revision (living proposal)

One proposal row per inquiry. Revisions update that row; there are no parallel proposals.

| Status | Edit | Send / Resend |
|--------|------|----------------|
| `draft` | Yes | Submit / Resend (new share link) |
| `sent` | Only after **Revise** (`begin-revision` → `draft`, invalidates live shares) | Resend OK without editing (same content → share email) |
| `revision_requested` | Same as sent: **Revise** first | After edits + Resend |
| `declined` | Yes; save resets to `draft` and invalidates shares | Then Resend |
| `accepted` | **Locked** — no content/money edits, no resend | — |

**Revise → Save → Resend** is required after send. Silent PATCH on a live `sent` link is rejected (`PROPOSAL_MUST_REVISE`).

**Emails on send:**

| Case | Template |
|------|----------|
| First send, or resend with **unchanged** commercial content | Proposal share email |
| Resend when content **changed** since last send (`last_sent_content_hash`) | Revised proposal email |

Accept is **idempotent**: accepting an already-accepted proposal returns the same project (no duplicate).

`revision_limit` on the proposal is about post-build site revision rounds, not proposal email rounds — not tracked in-app yet.

```text
draft ──Send──► sent ──BeginRevision──► draft ──Resend──► sent
                  │                        ▲
                  ├─Client revise──► revision_requested ──BeginRevision─┘
                  ├─Client decline──► declined ──Edit/Save──► draft
                  └─Client accept──► accepted (locked)
```

## Admin actions

| Stage | Admin UI / API | Effect |
|-------|----------------|--------|
| Send proposal | Proposal detail → Send | Share link email; proposal `sent`; stores content hash |
| Revise | Proposal detail → Revise | `draft`; live shares invalidated |
| Resend (unchanged) | Same Send modal | Share email again; new link |
| Resend (changed) | Same Send modal | Revised proposal email; new link |
| Accept | Client via public share link | Project `on_hold`; new clients get setup email, returning clients get direct project link |
| Mark as Started | Project detail (when `on_hold`) | `active`; client “project started” email |
| Auto-start | Payment + kickoff rules (`maybeActivateProject`) | Same as start; **also** emails admin |
| Mark as Completed | Project detail (when `active`) | `completed`; client “project complete” email |
| Mark Ready for Launch | Project detail (when `completed` + hosting plan) | Sets `ready_for_launch_at`; client launch email |
| Provision Site | Project detail (domain + managed hosting plan) | SSH to hosting droplet; nginx + Certbot; `project_sites` status. No email. Independent of Ready for Launch |
| Resend portal access | Project detail | Setup email when unset; shared-account password reset email when set |

Ready for Launch is **blocked** until the project is `completed` (`PROJECT_NOT_COMPLETED`).

**Provision Site** requires a valid `domain_name`, proposal `hosting_plan !== none`, and `CLIENT_HOSTING_*` on the API. Apex DNS must point at `CLIENT_HOSTING_PUBLIC_IP` or status becomes `dns_waiting`. Does not unlock Stripe checkout.

## Client emails

| Event | Who gets mail | Notes |
|-------|---------------|--------|
| Contact / project inquiry | Visitor + admin notify | Confirmation to visitor; notify to `INQUIRY_NOTIFY_TO` |
| Proposal share | Recipients you choose | Custom subject/body + View Proposal |
| Revised proposal | Recipients you choose | When commercial content changed since last send |
| Proposal accepted | Client + admin | “Proposal confirmed…”; project **on hold**; setup CTA or existing-account project link |
| Proposal revision / decline | Client + admin | Confirmation of their decision |
| Portal access invite | Client | One-time setup link for the shared client account |
| Forgot/reset password | Client | One-time reset link, then password-change confirmation |
| Project started | Client always; **admin only if auto-start** | Portal login URL (not setup token) |
| Project completed | Client | Mentions launch/hosting when a hosting plan exists |
| Ready for launch | Client | Hosting unlocked; domain/DNS may still need coordination |

Email send failures after a successful status change are **logged and do not roll back** the status (same idea as inquiry confirmation).

Templates live under [`server/src/services/email/templates/`](../server/src/services/email/templates/). Orchestration: [`server/src/services/projects.js`](../server/src/services/projects.js), [`server/src/services/proposals.js`](../server/src/services/proposals.js).

## Portal

Authentication belongs to the client, not the project: one email/password and one client-scoped session provide access to every eligible project owned by that client. Active, on-hold, and completed projects appear in the project selector; cancelled projects are excluded.

Clients can enter through `/client/login` with email + password. One eligible project redirects directly to its overview; multiple projects open `/client/projects`. Unique `/project/:id` links remain supported and ask only for the shared password when signed out. Setup links remain project-context links, but setting the password establishes the client-wide account.

Forgot-password responses never disclose whether an email exists. Reset tokens are random, stored only as SHA-256 hashes, expire after `CLIENT_PASSWORD_RESET_TTL_MINUTES`, are single-use, and revoke all client sessions after completion.

## Portal copy (hosting)

- **Completed, not ready for launch:** build is done; hosting unlocks when launch is marked ready.  
- **Ready for launch:** client can Start Hosting; domain/DNS may still need a check.  
- Checkout still requires `ready_for_launch_at` (`HOSTING_NOT_READY` if locked).

## Related docs

- Local commands and reset: [`README.md`](../README.md)  
- Production env, Stripe webhook, DB wipe: [`DEPLOY.md`](../DEPLOY.md)  
- Client hosting droplets / Provision Site: [`HOSTING.md`](HOSTING.md)
