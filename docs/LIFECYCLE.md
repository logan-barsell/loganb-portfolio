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
| Accept | Client via public share link | Project `on_hold` + portal setup token/email |
| Mark as Started | Project detail (when `on_hold`) | `active`; client “project started” email |
| Auto-start | Payment + kickoff rules (`maybeActivateProject`) | Same as start; **also** emails admin |
| Mark as Completed | Project detail (when `active`) | `completed`; client “project complete” email |
| Mark Ready for Launch | Project detail (when `completed` + hosting plan) | Sets `ready_for_launch_at`; client launch email |
| Resend portal access | Project detail | New setup link email |

Ready for Launch is **blocked** until the project is `completed` (`PROJECT_NOT_COMPLETED`).

## Client emails

| Event | Who gets mail | Notes |
|-------|---------------|--------|
| Contact / project inquiry | Visitor + admin notify | Confirmation to visitor; notify to `INQUIRY_NOTIFY_TO` |
| Proposal share | Recipients you choose | Custom subject/body + View Proposal |
| Revised proposal | Recipients you choose | When commercial content changed since last send |
| Proposal accepted | Client + admin | “Proposal confirmed…”; project **on hold**; portal setup CTA if issued |
| Proposal revision / decline | Client + admin | Confirmation of their decision |
| Portal access (invite/reset) | Client | Setup password link |
| Project started | Client always; **admin only if auto-start** | Portal login URL (not setup token) |
| Project completed | Client | Mentions launch/hosting when a hosting plan exists |
| Ready for launch | Client | Hosting unlocked; domain/DNS may still need coordination |

Email send failures after a successful status change are **logged and do not roll back** the status (same idea as inquiry confirmation).

Templates live under [`server/src/services/email/templates/`](../server/src/services/email/templates/). Orchestration: [`server/src/services/projects.js`](../server/src/services/projects.js), [`server/src/services/proposals.js`](../server/src/services/proposals.js).

## Portal

One portal per project. Clients use unique project links (setup + login). Unchanged by proposal revisions.

## Portal copy (hosting)

- **Completed, not ready for launch:** build is done; hosting unlocks when launch is marked ready.  
- **Ready for launch:** client can Start Hosting; domain/DNS may still need a check.  
- Checkout still requires `ready_for_launch_at` (`HOSTING_NOT_READY` if locked).

## Related docs

- Local commands and reset: [`README.md`](../README.md)  
- Production env, Stripe webhook, DB wipe: [`DEPLOY.md`](../DEPLOY.md)
