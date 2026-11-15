import { round, sum, ratio, days, money, metric, notice } from "./lib.mjs";
export const config = {
  slug: "lost-deal-revival",
  title: "Lost Deal Revival",
  description:
    "Revisit lost opportunities when there is a relevant reason to reconnect.",
  scope:
    "A local planning workspace. Review suggestions before acting; no automatic messages or financial transactions.",
  method:
    "Only waiting deals with contact permission and a due revisit date are suggested. Poor-fit deals are excluded; competitor losses require an explicit setting.",
  port: 4419,
  asOf: "2026-11-15",
  fields: [
    {
      key: "name",
      label: "Customer / business name",
      type: "text",
    },
    {
      key: "email",
      label: "Customer email",
      type: "email",
    },
    {
      key: "owner",
      label: "Owner",
      type: "text",
    },
    {
      key: "amount",
      label: "Amount",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "reason",
      label: "Loss reason",
      type: "select",
      options: [
        "timing",
        "budget",
        "missing-feature",
        "competitor",
        "poor-fit",
      ],
    },
    {
      key: "revisit",
      label: "Revisit date",
      type: "date",
    },
    {
      key: "trigger",
      label: "What has changed",
      type: "text",
    },
    {
      key: "consent",
      label: "Permission to reconnect",
      type: "boolean",
    },
    {
      key: "status",
      label: "Revival status",
      type: "select",
      options: ["waiting", "reopened", "closed"],
    },
  ],
  settings: [
    {
      key: "currency",
      label: "Currency code (one currency per workspace)",
      type: "text",
      maxLength: 3,
    },
    {
      key: "includeCompetitor",
      label: "Include competitor losses",
      type: "boolean",
    },
  ],
  actions: [
    {
      label: "Mark reopened",
      patch: {
        status: "reopened",
      },
      when: {
        status: ["waiting"],
      },
    },
    {
      label: "Close revival",
      patch: {
        status: "closed",
      },
      when: {
        status: ["waiting", "reopened"],
      },
    },
  ],
  document: false,
};

export const example = {
  schemaVersion: 1,
  project: "lost-deal-revival",
  settings: {
    currency: "USD",
    includeCompetitor: false,
  },
  records: [
    {
      id: "lost-1",
      name: "Maple Studio",
      email: "buyer@example.com",
      owner: "Amina",
      amount: 5000,
      reason: "timing",
      revisit: "2026-11-10",
      trigger: "New planning period has started",
      consent: true,
      status: "waiting",
    },
    {
      id: "lost-2",
      name: "River Foods",
      email: "team@example.com",
      owner: "Bilal",
      amount: 8000,
      reason: "poor-fit",
      revisit: "2026-11-01",
      trigger: "Requirements still outside our service",
      consent: true,
      status: "waiting",
    },
  ],
};
export function analyze(records, s, asOf) {
  const eligible = (r) =>
    r.status === "waiting" &&
    r.consent &&
    r.revisit <= asOf &&
    r.reason !== "poor-fit" &&
    (r.reason !== "competitor" || s.includeCompetitor);
  const due = records.filter(eligible);
  return {
    metrics: [
      metric("Relevant follow-ups", due.length),
      metric(
        "Potential deal value",
        money(sum(due.map((r) => r.amount))),
        s.currency,
      ),
      metric(
        "Reopened deals",
        records.filter((r) => r.status === "reopened").length,
      ),
    ],
    notices: [],
    columns: ["Customer", "Reason", "Revisit", "Next step"],
    rows: records.map((r) => ({
      id: r.id,
      Customer: r.name,
      Reason: r.reason,
      Revisit: r.revisit,
      "Next step": eligible(r)
        ? `Review with ${r.owner}: ${r.trigger}`
        : "No outreach suggested",
    })),
  };
}
