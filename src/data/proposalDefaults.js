import { sitePackages } from "./pricing";
import { DEFAULT_PAYMENT_SCHEDULE } from "./paymentSchedules";
import { DEFAULT_HOSTING_PLAN, resolveHostingPlan } from "./hostingPlans";

const PACKAGE_CENTS = {
  starter: 90000,
  business: 150000,
  growth: 250000,
};

function centsToDollarsInput(cents) {
  if (cents === null || cents === undefined) return "";
  return (Number(cents) / 100).toFixed(2).replace(/\.00$/, "");
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
].join("\n");

const FALLBACK_DEFAULTS = {
  summary: "Custom website proposal tailored to your business goals.",
  scope:
    "Design and build a custom marketing website based on your goals, branding direction, and agreed page set. Includes responsive layout, core pages, contact paths, and launch support.",
  deliverables: [
    "Custom website design and build",
    "Mobile-responsive layout",
    "Agreed core business pages",
    "Contact form and primary calls-to-action",
    "Basic SEO setup",
    "Launch support",
  ].join("\n"),
  exclusions: SHARED_EXCLUSIONS,
  timelineSummary: "3–4 weeks after kickoff and content handoff",
  revisionLimit: 2,
  paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
  designAmountCents: null,
  hostingPlan: DEFAULT_HOSTING_PLAN,
  hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
};

const PACKAGE_DEFAULTS = {
  starter: {
    summary:
      "A focused Starter Site that gets your business online with a clear set of core pages and a professional first impression.",
    scope:
      "Design and build a custom starter marketing website (approximately 3–5 core pages). Includes mobile-responsive layout, essential business pages, contact form and CTAs, basic SEO setup, and launch support.",
    deliverables: (
      sitePackages.find((p) => p.id === "starter")?.highlights || []
    ).join("\n"),
    exclusions: `${SHARED_EXCLUSIONS}\nAdvanced integrations or custom application features`,
    timelineSummary: "2–3 weeks after kickoff and content handoff",
    revisionLimit: 2,
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    designAmountCents: PACKAGE_CENTS.starter,
    hostingPlan: DEFAULT_HOSTING_PLAN,
    hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
  },
  business: {
    summary:
      "A Standard Site built to strengthen your online presence and help generate leads with a clear structure and strong calls-to-action.",
    scope:
      "Design and build a custom standard marketing website (approximately 6–10 pages). Includes expanded content structure, service pages, gallery or reviews section where needed, multiple CTAs, analytics setup, SEO-friendly structure, and launch support.",
    deliverables: (
      sitePackages.find((p) => p.id === "business")?.highlights || []
    ).join("\n"),
    exclusions: SHARED_EXCLUSIONS,
    timelineSummary: "3–4 weeks after kickoff and content handoff",
    revisionLimit: 2,
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    designAmountCents: PACKAGE_CENTS.business,
    hostingPlan: DEFAULT_HOSTING_PLAN,
    hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
  },
  growth: {
    summary:
      "A Premium Site for businesses that need advanced functionality, custom layouts, or deeper integrations beyond a standard marketing site.",
    scope:
      "Design and build a custom premium website with advanced layouts and agreed custom functionality. Includes third-party integrations as scoped, content strategy support as needed, priority launch support, and a more tailored delivery plan.",
    deliverables: (
      sitePackages.find((p) => p.id === "growth")?.highlights || []
    ).join("\n"),
    exclusions: `${SHARED_EXCLUSIONS}\nFeatures or integrations not listed in Scope / Deliverables`,
    timelineSummary: "4–6 weeks after kickoff and content handoff",
    revisionLimit: 3,
    paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
    designAmountCents: PACKAGE_CENTS.growth,
    hostingPlan: DEFAULT_HOSTING_PLAN,
    hostingMonthlyCents: resolveHostingPlan(DEFAULT_HOSTING_PLAN).amountCents,
  },
  redesign: {
    summary:
      "A website redesign proposal focused on improving your existing site’s structure, design, and conversion paths.",
    scope:
      "Redesign and rebuild your existing website based on your current content, goals, and agreed page set. Includes updated visual design, improved information architecture, mobile-responsive layout, and launch support. Exact page count and feature set confirmed after review.",
    deliverables: [
      "Custom redesign of agreed pages",
      "Mobile-responsive layout",
      "Improved navigation and calls-to-action",
      "Content migration for agreed pages",
      "Basic SEO setup",
      "Launch support",
    ].join("\n"),
    exclusions: SHARED_EXCLUSIONS,
    timelineSummary: "3–5 weeks after kickoff and content handoff",
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
    scope:
      "Custom website design and development based on the requirements discussed. Scope, pages, and features will be confirmed in this proposal before work begins.",
  },
  hosting: {
    summary: "Managed hosting and ongoing technical support for your website.",
    scope:
      "Provide managed hosting, backups, uptime monitoring, essential updates, and ongoing technical support for your website.",
    deliverables: [
      "Managed hosting setup",
      "Automated backups",
      "Uptime monitoring",
      "Essential platform updates",
      "Ongoing technical support",
    ].join("\n"),
    exclusions: [
      "New feature development or redesign work",
      "Copywriting or content updates beyond minor technical fixes",
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
    kickoffDate: "",
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
