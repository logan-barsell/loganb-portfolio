import { sitePackages } from "./pricing";
import { DEFAULT_PAYMENT_SCHEDULE } from "./paymentSchedules";
import { DEFAULT_HOSTING_PLAN, resolveHostingPlan } from "./hostingPlans";
import dayjs from "dayjs";

const PACKAGE_CENTS = {
  starter: 90000,
  business: 150000,
  growth: 300000,
};

/** Local calendar date as YYYY-MM-DD for new proposal kickoff defaults. */
export function todayYmd() {
  return dayjs().format("YYYY-MM-DD");
}

function centsToDollarsInput(cents) {
  if (cents === null || cents === undefined) return "";
  return (Number(cents) / 100).toFixed(2).replace(/\.00$/, "");
}

const CONTENT_OWNERSHIP = [
  "Client provides final copy, logo, photos, and domain access.",
  "If materials are missing, the site may use placeholder text and stock or AI imagery so work can continue; placeholders are temporary fill and are not guaranteed to match final preferences.",
  "Final content is the client’s responsibility—either supply what you want or accept the placeholders used.",
].join(" ");

const PLACEHOLDER_DELIVERABLE =
  "Client-provided content and assets incorporated when supplied; placeholders used where needed";

function withContentOwnership(scope) {
  return `${scope}\n\n${CONTENT_OWNERSHIP}`;
}

function withPlaceholderDeliverable(lines) {
  const list = Array.isArray(lines) ? lines : String(lines || "").split("\n").filter(Boolean);
  if (list.includes(PLACEHOLDER_DELIVERABLE)) return list.join("\n");
  return [...list, PLACEHOLDER_DELIVERABLE].join("\n");
}

const SHARED_EXCLUSIONS = [
  "Copywriting and content writing",
  "Logo design or full brand identity",
  "Professional photography or stock photo licensing beyond agreed placeholders",
  "E-commerce / online store functionality",
  "Paid advertising setup or management (Google Ads, Meta, etc.)",
  "Ongoing SEO campaigns or content marketing",
  "Unlimited revision rounds beyond the included revision limit",
  "Content entry beyond the agreed page set",
  "Items not listed in Scope or Deliverables",
].join("\n");

const FALLBACK_DEFAULTS = {
  summary: "Custom website proposal tailored to your business goals.",
  scope: withContentOwnership(
    "Design and build a custom marketing website based on your goals, branding direction, and the page set listed in Deliverables. Includes responsive layout, core pages, contact paths, and launch support."
  ),
  deliverables: withPlaceholderDeliverable([
    "Custom website design and build",
    "Mobile-responsive layout",
    "Agreed core business pages",
    "Contact form and primary calls-to-action",
    "Basic SEO setup",
    "Launch support",
  ]),
  exclusions: SHARED_EXCLUSIONS,
  timelineSummary: "3–4 weeks after kickoff and content/access handoff",
  revisionLimit: 2,
  paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
  designAmountCents: null,
  hostingPlan: DEFAULT_HOSTING_PLAN,
  hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
};

const PACKAGE_DEFAULTS = {
  starter: {
    summary:
      "A focused Starter Website that establishes your online presence with a clear set of core pages and a professional first impression.",
    scope: withContentOwnership(
      "Design and build a custom starter brochure-style website. Includes responsive layout for desktop, tablet, and mobile; pages listed in Deliverables (typically Home, About, Services, Gallery or Portfolio, and Contact); contact form; Google Maps; social links; basic on-page SEO; performance optimization; and launch support."
    ),
    deliverables: withPlaceholderDeliverable(
      sitePackages.find((p) => p.id === "starter")?.highlights || []
    ),
    exclusions: `${SHARED_EXCLUSIONS}\nAdvanced integrations or custom application features`,
    timelineSummary: "2–3 weeks after kickoff and content/access handoff",
    revisionLimit: 2,
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    designAmountCents: PACKAGE_CENTS.starter,
    hostingPlan: DEFAULT_HOSTING_PLAN,
    hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
  },
  business: {
    summary:
      "A Growth Website built to generate leads, showcase your services in depth, and streamline customer interactions.",
    scope: withContentOwnership(
      "Design and build a custom Growth Website that includes everything in Starter, plus expanded site architecture, individual service pages, reviews and testimonials, FAQ, booking or scheduling and online payment integrations as scoped, lead capture improvements, analytics setup, enhanced SEO structure, and additional third-party integrations. Agreed pages and features are listed in Deliverables."
    ),
    deliverables: withPlaceholderDeliverable(
      sitePackages.find((p) => p.id === "business")?.highlights || []
    ),
    exclusions: SHARED_EXCLUSIONS,
    timelineSummary: "3–4 weeks after kickoff and content/access handoff",
    revisionLimit: 2,
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    designAmountCents: PACKAGE_CENTS.business,
    hostingPlan: DEFAULT_HOSTING_PLAN,
    hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
  },
  growth: {
    summary:
      "A Custom Web Application tailored to your business—from client portals and admin tools to workflow automation and SaaS-style platforms.",
    scope: withContentOwnership(
      "Design and build custom software based on your requirements. Scope may include authentication, dashboards, client portals, custom databases, workflow automation, API integrations, analytics and reporting, and other agreed application features listed in Deliverables. Exact deliverables are confirmed in this proposal before work begins."
    ),
    deliverables: withPlaceholderDeliverable(
      sitePackages.find((p) => p.id === "growth")?.highlights || []
    ),
    exclusions: SHARED_EXCLUSIONS,
    timelineSummary: "4–8 weeks after kickoff and content/access handoff, depending on complexity",
    revisionLimit: 3,
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    designAmountCents: PACKAGE_CENTS.growth,
    hostingPlan: DEFAULT_HOSTING_PLAN,
    hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
  },
  redesign: {
    summary:
      "A website redesign proposal focused on improving your existing site’s structure, design, and conversion paths.",
    scope: withContentOwnership(
      "Redesign and rebuild your existing website based on your current content, goals, and the page set listed in Deliverables. Includes updated visual design, improved information architecture, mobile-responsive layout, and launch support."
    ),
    deliverables: withPlaceholderDeliverable([
      "Custom redesign of agreed pages",
      "Mobile-responsive layout",
      "Improved navigation and calls-to-action",
      "Content migration for agreed pages",
      "Basic SEO setup",
      "Launch support",
    ]),
    exclusions: SHARED_EXCLUSIONS,
    timelineSummary: "3–5 weeks after kickoff and content/access handoff",
    revisionLimit: 2,
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    designAmountCents: null,
    hostingPlan: DEFAULT_HOSTING_PLAN,
    hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
  },
  custom: {
    ...FALLBACK_DEFAULTS,
    summary:
      "A custom website proposal scoped to your specific goals, features, and constraints.",
    scope: withContentOwnership(
      "Custom website design and development based on the requirements discussed. Scope, pages, and features listed in Deliverables are confirmed in this proposal before work begins."
    ),
  },
  hosting: {
    summary: "Managed Hosting + Support for your website.",
    scope:
      "Provide Managed Hosting + Support: secure cloud hosting, SSL, automatic backups, security updates, uptime monitoring, minor content updates, and ongoing technical support.",
    deliverables: [
      "Managed hosting setup",
      "SSL certificate",
      "Automatic backups",
      "Security updates",
      "Uptime monitoring",
      "Minor content updates",
      "Ongoing technical support",
    ].join("\n"),
    exclusions: [
      "New feature development or redesign work",
      "Copywriting or content updates beyond minor edits",
      "Paid advertising or SEO campaigns",
    ].join("\n"),
    timelineSummary: "Setup within 1 week of kickoff",
    revisionLimit: 1,
    paymentSchedule: "full_upfront",
    designAmountCents: null,
    hostingPlan: DEFAULT_HOSTING_PLAN,
    hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
  },
  "not-sure": {
    ...FALLBACK_DEFAULTS,
    summary:
      "A website proposal shaped after clarifying your goals, pages, and preferred package.",
  },
};

/**
 * Defaults for a new proposal draft from an inquiry package slug.
 * @param {string | null | undefined} packageSlug
 * @param {{ businessName?: string, name?: string }} [client]
 */
export function getProposalDefaults(packageSlug, client = {}) {
  const slug =
    packageSlug && PACKAGE_DEFAULTS[packageSlug] ? packageSlug : "custom";
  const base = { ...FALLBACK_DEFAULTS, ...PACKAGE_DEFAULTS[slug] };
  const who = client.businessName || client.name;
  if (who && base.summary && !base.summary.includes(who)) {
    base.summary = `${base.summary.replace(/\.$/, "")} for ${who}.`;
  }
  return base;
}

/** Form-ready seed values (dollar strings, revision as number or ''). */
export function seedProposalFormFromInquiry(inquiry) {
  const defaults = getProposalDefaults(inquiry?.packageSlug, {
    businessName: inquiry?.businessName,
    name: inquiry?.name,
  });

  const hostingEmpty =
    inquiry?.packageSlug === "self-hosted" ||
    String(inquiry?.requestedFeatures || "")
      .toLowerCase()
      .includes("self-host");

  return {
    summary: defaults.summary || "",
    scope: inquiry?.websiteGoals?.trim()
      ? `${defaults.scope}\n\nClient goals:\n${inquiry.websiteGoals.trim()}`
      : defaults.scope || "",
    deliverables: defaults.deliverables || "",
    exclusions: defaults.exclusions || "",
    timelineSummary: defaults.timelineSummary || "",
    kickoffDate: todayYmd(),
    packageSlug: inquiry?.packageSlug || "not-sure",
    paymentSchedule: defaults.paymentSchedule || DEFAULT_PAYMENT_SCHEDULE,
    revisionLimit:
      defaults.revisionLimit === null || defaults.revisionLimit === undefined
        ? ""
        : String(defaults.revisionLimit),
    designAmountDollars: defaults.designAmountCents
      ? centsToDollarsInput(defaults.designAmountCents)
      : "",
    hostingPlan: hostingEmpty ? "none" : defaults.hostingPlan || DEFAULT_HOSTING_PLAN,
  };
}

export { PACKAGE_CENTS };
