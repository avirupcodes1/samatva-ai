/*
 * RAG knowledge base — a small, curated corpus of evidence-based well-being
 * techniques for exam aspirants. The companion/journal prompts RETRIEVE the
 * most relevant snippets and are asked to ground their reply in them, so a
 * smaller model draws on vetted content instead of inventing advice.
 *
 * Retrieval is lexical (BM25-lite: TF × IDF + tag boost) — deterministic,
 * dependency-free, no embeddings call, and easy to unit test.
 */

export interface Snippet {
  id: string;
  title: string;
  text: string;
  tags: string[];
}

export const KNOWLEDGE: Snippet[] = [
  { id: "exam-anxiety", title: "Exam anxiety is your body, not a verdict", text: "Exam anxiety is your body preparing, not proof you'll fail. Naming it — 'this is anxiety, and it will pass' — loosens its grip, and a few slow exhales tell your nervous system you're safe.", tags: ["anxiety", "exam", "nervous", "panic", "fear", "scared", "worried"] },
  { id: "panic-before-exam", title: "Calming a panic spike fast", text: "If panic hits right before an exam, try the physiological sigh: two short inhales through the nose, then one long slow exhale. It's the fastest evidence-based way to settle the body in under a minute.", tags: ["panic", "exam", "hall", "breathing", "calm", "spike"] },
  { id: "focus-start", title: "Beating the can't-start feeling", text: "When you can't begin, shrink the task: commit to just five minutes. Starting is the hardest part, and momentum usually follows once you've begun.", tags: ["focus", "procrastination", "start", "distracted", "study", "lazy", "avoid"] },
  { id: "comparison", title: "Comparison is unfair to you", text: "Comparing your progress to toppers pits your behind-the-scenes against their highlight reel. Your only fair benchmark is you, yesterday.", tags: ["comparison", "toppers", "others", "jealous", "behind", "everyone"] },
  { id: "sleep", title: "Sleep protects memory and mood", text: "Sleep is when your brain consolidates what you studied, so an all-nighter usually costs more than it gains. A consistent wind-down time protects both memory and mood.", tags: ["sleep", "insomnia", "allnighter", "tired", "rest", "night", "awake"] },
  { id: "rest-guilt", title: "Rest is part of studying", text: "Rest isn't a reward you earn after enough studying — it's part of studying. Guilt about resting is common, but a rested brain learns faster than an exhausted one.", tags: ["rest", "guilt", "guilty", "break", "exhausted", "burnout"] },
  { id: "burnout", title: "Burnout is effort without recovery", text: "Burnout builds when there's effort without recovery. If everything feels flat and heavy, that's a signal to add small doses of recovery, not to push harder.", tags: ["burnout", "exhausted", "drained", "flat", "unmotivated", "heavy"] },
  { id: "mock-result", title: "A mock score is data, not a verdict", text: "A low mock score is data, not a verdict — it shows what to revise while there's still time, which is exactly what mocks are for. One test doesn't define your rank.", tags: ["mock", "test", "result", "marks", "score", "failed", "rank", "bad"] },
  { id: "cbt-reframe", title: "Question the catastrophic thought", text: "When a harsh thought appears — 'I'll never crack this' — ask what the evidence for and against it actually is. The catastrophic version is rarely the accurate one.", tags: ["thoughts", "negative", "catastrophe", "reframe", "hopeless", "never"] },
  { id: "self-compassion", title: "Speak to yourself like a friend", text: "Talk to yourself the way you'd talk to a friend in the same spot — with kindness, not contempt. Self-criticism drains the very energy you need to keep going.", tags: ["compassion", "harsh", "hate", "kind", "worthless", "stupid"] },
  { id: "breaks", title: "The brain focuses in sprints", text: "The brain focuses in sprints, not marathons. Short breaks — even five minutes every 25 to 50 — actually improve retention compared with grinding non-stop.", tags: ["breaks", "pomodoro", "focus", "long", "concentration"] },
  { id: "overwhelm", title: "Zoom in on the next step", text: "When the syllabus feels impossibly big, zoom in on the single next thing. You don't have to see the whole staircase to take one step.", tags: ["overwhelm", "syllabus", "much", "everything", "pressure", "big"] },
  { id: "grounding", title: "5-4-3-2-1 to stop a spiral", text: "If anxious thoughts spiral, try 5-4-3-2-1: name five things you see, four you can touch, three you hear, two you smell, one you taste. It pulls you back to the present.", tags: ["grounding", "spiral", "anxious", "present", "panic", "racing"] },
  { id: "motivation", title: "Action doesn't need motivation", text: "Motivation naturally comes and goes; small routines carry you through the dips. You don't need to feel motivated to take one small action.", tags: ["motivation", "unmotivated", "lazy", "discipline", "routine"] },
  { id: "expectations", title: "Others' anxiety isn't your worth", text: "Others' expectations can feel crushing, but their anxiety is not a measure of your worth. You're allowed to define success on your own terms.", tags: ["parents", "expectations", "pressure", "family", "disappoint"] },
  { id: "worth", title: "You're more than a rank", text: "Your worth as a person is not decided by a rank or a cutoff. Whatever the result, you remain far more than a score.", tags: ["worth", "rank", "cutoff", "value", "failure", "define"] },
  { id: "study-balance", title: "Balance is a study strategy", text: "A day of only studying isn't the most productive day — meals, movement, and a little connection keep the mind sharp. Balance is a study strategy, not a distraction.", tags: ["balance", "meals", "movement", "life", "allday"] },
  { id: "night-worry", title: "Park worries with a brain dump", text: "If your mind races at night, keep a brain-dump pad and write the worries down to park them until morning. It tells your brain it's safe to rest.", tags: ["night", "racing", "sleep", "rumination", "worry", "overthinking"] },
  { id: "ask-help", title: "Reaching out lightens the load", text: "Reaching out isn't weakness — talking to someone you trust genuinely lightens the load. You don't have to carry this alone.", tags: ["help", "alone", "support", "talk", "trust", "lonely"] },
  { id: "perfectionism", title: "Done beats perfect", text: "Aiming for perfect often stalls progress; 'done and reviewed' beats 'perfect and unfinished'. Let your first attempt be imperfect.", tags: ["perfectionism", "perfect", "enough", "stuck"] },
  { id: "exam-day", title: "Don't cram on exam morning", text: "On exam day, stick to your normal routine and a light warm-up. Cramming brand-new material tends to raise anxiety more than it helps.", tags: ["examday", "cramming", "routine", "morning", "day"] },
  { id: "body-first", title: "Shift your state through the body", text: "Anxiety lives in the body too — water, a short walk, and a few stretches can shift your state faster than trying to think your way calm.", tags: ["body", "water", "walk", "stretch", "physical", "anxious"] },
  { id: "small-wins", title: "Count the small wins", text: "Notice small wins — a topic revised, a doubt cleared. Progress you never acknowledge ends up feeling like no progress at all.", tags: ["progress", "wins", "stuck", "nothing", "achievement"] },
  { id: "social-media", title: "Muting the feed is self-care", text: "Social media makes everyone's prep look flawless. Muting the accounts that spike your anxiety is a legitimate act of self-care.", tags: ["social", "instagram", "comparison", "feed", "phone"] },
  { id: "one-day", title: "Only today's part", text: "You can't study the whole exam today — only today's part. Trust that consistent small days add up to a prepared you.", tags: ["oneday", "consistency", "future", "prepared", "worry"] },
  { id: "self-doubt", title: "Doubt means you care", text: "Self-doubt visits everyone preparing seriously — it's a sign you care, not proof you aren't capable.", tags: ["doubt", "capable", "notgoodenough", "insecure"] },
  { id: "fear-failure", title: "Failing an event, not being a failure", text: "Fear of failing shrinks when you separate it from your identity: 'failing a test' is an event, not 'being a failure'.", tags: ["failure", "fear", "scared", "fail"] },
  { id: "gratitude", title: "One good thing rebalances the day", text: "Ending the day by noting one thing that went okay gently rebalances a mind that's been scanning for problems all day.", tags: ["gratitude", "positive", "reflect", "day"] },
  { id: "concentration", title: "Attention refills with rest", text: "Losing focus after long study isn't weakness — attention is a finite resource that refills with rest, food, water, and sleep.", tags: ["concentration", "focus", "tired", "fatigue", "drained"] },
  { id: "breath-478", title: "The 4-7-8 reset", text: "The 4-7-8 breath — inhale for four, hold for seven, exhale for eight — activates the calming branch of your nervous system and is a quick reset before study or sleep.", tags: ["breathing", "calm", "anxious", "sleep", "reset"] },
];

/* ---- Lexical retrieval (BM25-lite) -------------------------------- */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "am", "are", "was", "were", "be",
  "to", "of", "in", "on", "for", "it", "this", "that", "with", "you", "your",
  "my", "me", "i", "so", "if", "at", "as", "not", "no", "do", "does", "did",
  "can", "will", "just", "have", "has", "get", "got", "im", "ive", "dont",
  "cant", "really", "very", "too", "about", "like", "feel", "feeling", "feels",
  "up", "out", "now", "today", "how", "what", "why", "when", "there", "then",
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z']+/g) ?? [])
    .map((w) => w.replace(/'/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Precompute per-snippet term frequencies + document frequencies (IDF).
const DOCS = KNOWLEDGE.map((s) => {
  const tf = new Map<string, number>();
  for (const t of [...tokenize(s.title), ...tokenize(s.text)]) tf.set(t, (tf.get(t) ?? 0) + 1);
  const tagSet = new Set(s.tags.flatMap((t) => tokenize(t)));
  return { tf, tagSet };
});
const N = KNOWLEDGE.length;
const DF = new Map<string, number>();
for (const d of DOCS) {
  for (const term of new Set([...d.tf.keys(), ...d.tagSet])) DF.set(term, (DF.get(term) ?? 0) + 1);
}
const idf = (t: string) => Math.log((N + 1) / ((DF.get(t) ?? 0) + 1)) + 1;

/** Top-k curated snippets most relevant to the query (empty if nothing matches). */
export function retrieve(query: string, k = 3): Snippet[] {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];
  return KNOWLEDGE.map((snip, i) => {
    const d = DOCS[i];
    let score = 0;
    for (const term of terms) {
      const tf = d.tf.get(term) ?? 0;
      if (tf > 0) score += idf(term) * (1 + Math.log(tf));
      if (d.tagSet.has(term)) score += idf(term) * 1.5; // curated-tag boost
    }
    return { snip, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.snip);
}

/** Format retrieved snippets for injection into the system prompt. */
export function groundingBlock(snippets: Snippet[]): string {
  if (snippets.length === 0) return "";
  return (
    "\n\nGround your reply in these vetted, evidence-based techniques where they fit — paraphrase them naturally in your own warm voice, never quote or list them mechanically:\n" +
    snippets.map((s) => `- ${s.title}: ${s.text}`).join("\n")
  );
}
