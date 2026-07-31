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
      "A focused Starter Website that establishes your online presence with a clear set of core pages and a professional first impression.",
    scope:
      "Design and build a custom starter brochure-style website. Includes responsive layout for desktop, tablet, and mobile; Home, About, Services, Gallery or Portfolio, and Contact pages; contact form; Google Maps; social links; basic on-page SEO; performance optimization; and launch support.",
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
      "A Growth Website built to generate leads, showcase your services in depth, and streamline customer interactions.",
    scope:
      "Design and build a custom Growth Website that includes everything in Starter, plus expanded site architecture, individual service pages, reviews and testimonials, FAQ, booking or scheduling and online payment integrations as scoped, lead capture improvements, analytics setup, enhanced SEO structure, and additional third-party integrations.",
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
      "A Custom Web Application tailored to your business—from client portals and admin tools to workflow automation and SaaS-style platforms.",
    scope:
      "Design and build custom software based on your requirements. Scope may include authentication, dashboards, client portals, custom databases, workflow automation, API integrations, analytics and reporting, and other agreed application features. Exact deliverables are confirmed in this proposal before work begins.",
    deliverables: (
      sitePackages.find((p) => p.id === "growth")?.highlights || []
    ).join("\n"),
    exclusions: `${SHARED_EXCLUSIONS}\nFeatures or integrations not listed in Scope / Deliverables`,
    timelineSummary: "4–8 weeks after kickoff and requirements lock, depending on complexity",
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
