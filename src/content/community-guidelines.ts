/** Patterns matched case-insensitively after text normalization. */
export const BLOCKED_TEXT_PATTERNS: RegExp[] = [
  /\b(kill\s+yourself|kys)\b/i,
  /\b(n[i1!|]gg[aer]?|f[a@4]gg[o0]t|r[e3]t[a@4]rd)\b/i,
  /\b(sexual\s+content|send\s+nudes)\b/i,
];

export const COMMUNITY_GUIDELINES = [
  "Be kind — no harassment, hate speech, or bullying.",
  "Keep it cat-focused. No sexual, violent, or graphic content.",
  "No spam, scams, or repeated promotional links.",
  "Rescue alerts must be accurate. False urgent alerts may lead to a ban.",
  "Do not share personal info (addresses, phone numbers) in chat.",
  "Strong language is auto-censored; slurs and harassment are not allowed.",
  "Report anything that feels unsafe. We review reports manually.",
] as const;

export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or hate" },
  { value: "spam", label: "Spam or scam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "false_alert", label: "False rescue alert" },
  { value: "other", label: "Other" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];
