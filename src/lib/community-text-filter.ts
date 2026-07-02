import { BLOCKED_WORDS, CENSORED_WORDS } from "@/content/blocked-words";
import { BLOCKED_TEXT_PATTERNS } from "@/content/community-guidelines";

const BLOCKED_SET = new Set(BLOCKED_WORDS.map((w) => w.toLowerCase()));
const CENSORED_SET = new Set(CENSORED_WORDS.map((w) => w.toLowerCase()));

const WORD_PATTERN = /\b[\w@$0-9']+\b/giu;

/** Collapse leetspeak / spacing tricks for matching only. */
export function normalizeWordForFilter(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@4]/g, "a")
    .replace(/8/g, "b")
    .replace(/[({[]/g, "c")
    .replace(/3/g, "e")
    .replace(/[6]/g, "g")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")
    .replace(/7/g, "t")
    .replace(/5/g, "s")
    .replace(/[*_.-]/g, "");
}

export function normalizeCommunityText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function maskWord(word: string): string {
  if (word.length <= 1) return "*";
  if (word.length === 2) return `${word[0]}*`;
  return `${word[0]}${"*".repeat(word.length - 1)}`;
}

function containsBlockedPhrase(text: string): boolean {
  const collapsed = normalizeCommunityText(text).toLowerCase();
  for (const phrase of BLOCKED_WORDS) {
    if (phrase.includes(" ")) {
      const normalizedPhrase = normalizeWordForFilter(phrase.replace(/\s+/g, " "));
      if (collapsed.includes(normalizedPhrase)) return true;
    }
  }
  for (const pattern of BLOCKED_TEXT_PATTERNS) {
    if (pattern.test(collapsed)) return true;
  }
  return false;
}

function wordIsBlocked(normalized: string): boolean {
  return BLOCKED_SET.has(normalized);
}

function wordIsCensored(normalized: string): boolean {
  return CENSORED_SET.has(normalized);
}

/** Reject slurs, threats, and severe terms. */
export function validateCommunityText(
  text: string,
  options: { allowLinks?: boolean } = {},
): { ok: true } | { ok: false; error: string } {
  const normalized = normalizeCommunityText(text);
  if (!normalized) {
    return { ok: false, error: "Message cannot be empty." };
  }

  if (containsBlockedPhrase(normalized)) {
    return {
      ok: false,
      error: "This content violates community guidelines.",
    };
  }

  for (const match of normalized.matchAll(WORD_PATTERN)) {
    const token = match[0];
    const key = normalizeWordForFilter(token);
    if (wordIsBlocked(key)) {
      return {
        ok: false,
        error: "This content violates community guidelines.",
      };
    }
  }

  if (!options.allowLinks && /https?:\/\/|www\./i.test(normalized)) {
    return {
      ok: false,
      error: "Links are not allowed in community messages.",
    };
  }

  return { ok: true };
}

/** Mask mild profanity (e.g. fuck → f***) while keeping the message. */
export function censorCommunityText(text: string): string {
  return text.replace(WORD_PATTERN, (word) => {
    const key = normalizeWordForFilter(word);
    if (wordIsBlocked(key) || wordIsCensored(key)) {
      return maskWord(word);
    }
    return word;
  });
}
