/*
 * Safety layer — the most important module in Samatva.
 *
 * This runs INDEPENDENTLY of the language model on every user message and
 * journal entry. It is a deterministic keyword/phrase backstop so that a
 * model hallucination, jailbreak, or outage can never suppress an
 * escalation. When it fires, callers must short-circuit the normal flow and
 * surface the caring response + helplines below.
 */

export interface Helpline {
  name: string;
  detail: string;
  phone: string;
  hours: string;
}

/** India-focused crisis resources. Update per deployment region. */
export const HELPLINES: Helpline[] = [
  {
    name: "Tele-MANAS",
    detail: "Govt. of India national mental health helpline",
    phone: "14416",
    hours: "24×7",
  },
  {
    name: "KIRAN",
    detail: "Ministry of Social Justice mental health rehab line",
    phone: "1800-599-0019",
    hours: "24×7",
  },
  {
    name: "iCall (TISS)",
    detail: "Psychosocial counselling by trained professionals",
    phone: "9152987821",
    hours: "Mon–Sat, 8am–10pm",
  },
  {
    name: "Vandrevala Foundation",
    detail: "Free confidential mental health support",
    phone: "1860-2662-345",
    hours: "24×7",
  },
  {
    name: "AASRA",
    detail: "Suicide prevention & emotional support",
    phone: "9820466726",
    hours: "24×7",
  },
];

/*
 * Crisis phrase patterns. Intentionally high-recall (we would rather show a
 * helpline unnecessarily than miss a genuine cry for help). Word boundaries
 * keep obvious false positives ("kill it in the exam") from matching.
 */
const CRISIS_PATTERNS: RegExp[] = [
  // Require "myself" — "kill/killing me" is an extremely common idiom
  // ("this syllabus is killing me") and would flood real alerts with noise.
  /\bkill(ing)?\s+myself\b/i,
  /\bwant\s+(to\s+)?(someone|somebody)\s+to\s+kill\s+me\b/i,
  /\bkms\b/i,
  /\bend(ing)?\s+(my|it)\s+(life|all)\b/i,
  /\bend\s+it\s+all\b/i,
  /\b(take|taking|took)\s+my\s+(own\s+)?life\b/i,
  /\bcommit(ting)?\s+suicide\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(want|wanna|going)\s+to\s+die\b/i,
  /\b(i|i'?m)\s+(want|wish)\s+.*\bdead\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+here|exist)\b/i,
  /\bno\s+(reason|point)\s+(to|in)\s+(living|life)\b/i,
  /\bcan'?t\s+go\s+on\b/i,
  /\bhurt(ing)?\s+myself\b/i,
  /\b(self[-\s]?harm|cutting\s+myself)\b/i,
  /\bwhat'?s\s+the\s+point\s+of\s+(living|life|anything)\b/i,
  /\b(nobody|no\s*one)\s+would\s+(miss|care|notice)\b/i,
  /\bworthless\b.*\b(die|dead|gone)\b/i,
  // passive / modal death wishes
  /\bfeel(ing)?\s+like\s+dying\b/i,
  /\bwish\s+i\s+(was|were)\s+dead\b/i,
  /\bwish\s+i\s+(could|would|might)\s+(die|not\s+wake)\b/i,
  /\bwant\s+to\s+disappear\b/i,
  /\bwish\s+i\s+could\s+disappear\b/i,
  /\b(don'?t|do\s+not)\s+want\s+to\s+wake\s+up\b/i,
  /\bhope\s+i\s+(don'?t|never)\s+wake\s+up\b/i,
  /\bnever\s+wake\s+up\b/i,
  // reasons-to-live / worth
  /\bnothing\s+(left\s+)?to\s+live\s+for\b/i,
  /\b(not|isn'?t|no\s+longer)\s+worth\s+living\b/i,
  /\bgive\s+up\s+on\s+(life|living|everything)\b/i,
  // methods
  /\b(overdose|over\s?dose)\b/i,
  /\bhang(ing)?\s+myself\b/i,
  /\bslit(ting)?\s+my\b/i,
  /\bjump(ing)?\s+(off|in\s+front)\b/i,
  // self-harm (generalised)
  /\bcut(ting)?\s+myself\b/i,
  /\bharm(ing)?\s+myself\b/i,
];

export interface SafetyResult {
  isCrisis: boolean;
  matched: string[];
}

/** Deterministic crisis screen. Never throws; safe on any input. */
export function screenForCrisis(text: string): SafetyResult {
  const matched: string[] = [];
  if (!text) return { isCrisis: false, matched };
  for (const pattern of CRISIS_PATTERNS) {
    const m = text.match(pattern);
    if (m) matched.push(m[0]);
  }
  return { isCrisis: matched.length > 0, matched };
}

/** The caring message shown in place of a normal reply when crisis is detected. */
export function crisisResponseMessage(name?: string): string {
  const who = name ? `${name}, ` : "";
  return (
    `${who}I hear how much pain you're carrying right now, and I'm really glad you told me. ` +
    `You deserve support from someone who can be with you through this. ` +
    `Please reach out to one of the helplines below — they're free, confidential, and available to talk right now. ` +
    `If you feel you might act on these thoughts or you're in immediate danger, please call your local emergency number (112 in India) or go to the nearest hospital. ` +
    `You are not alone in this, and this feeling can change with the right support. 💚`
  );
}
