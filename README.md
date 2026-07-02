# Samatva — an AI well-being companion for exam aspirants

> **समत्व** (*samatva*) — equanimity, balance of mind.

Samatva is a gentle web app that helps students preparing for high-stakes exams
(JEE, NEET, UPSC, GATE, CAT, boards…) **monitor and improve their mental
well-being**. It pairs quick self-tracking with a warm, private AI companion
powered by **Gemma** (run locally via Ollama), and a safety layer that surfaces
real help when it matters.

## ✨ Features

- **Daily check-in** — a 10-second pulse on mood, energy, stress and sleep.
- **AI companion** — an empathetic, boundaried chat companion (Gemma).
- **Guided journaling** — write freely and get a caring reflection back.
- **Calm toolkit** — box / 4-7-8 breathing, 5-4-3-2-1 grounding, and a focus timer.
- **Insights** — mood trends, distribution, and an AI weekly summary.
- **Exam-aware** — countdown and context so support fits your prep.
- **Safety net** — an independent crisis-phrase detector that always shows
  helplines and a caring response, never routed through the model.
- **Privacy** — export or permanently delete your data anytime.

## 🧱 Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS v4 |
| Auth | bcrypt password hashing + signed-cookie JWT sessions (`jose`) |
| AI | Gemma via [Ollama](https://ollama.com) (`/api/chat`) |
| Storage | JSON files under `/data` (prototype — swap for a DB later) |
| Icons | lucide-react |

There is **no ML pipeline** — the app simply sends well-crafted prompts to
Gemma and reads the text back. If Ollama is offline, every AI feature degrades
gracefully to a warm hand-written fallback, so the app still demos.

## 🚀 Getting started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# edit SESSION_SECRET; leave OLLAMA_URL/GEMMA_MODEL as-is for local Ollama
```

### 3. (Optional) Run Gemma via Ollama
```bash
# needs Ollama >= 0.22 for Gemma 4
ollama pull gemma4
ollama serve            # serves at http://localhost:11434
```
The app works without this — companion/journal/insights just use fallbacks.

### 4. Run the app
```bash
npm run dev
# open http://localhost:3000
```

## 🔒 Safety & scope

Samatva is a **well-being companion, not a medical or crisis service**. The
companion never diagnoses or gives medical advice. A deterministic safety layer
(`src/lib/safety.ts`) screens every message and journal entry for crisis
language, and — independently of the model — surfaces India-focused helplines
(Tele-MANAS 14416, KIRAN, iCall, Vandrevala, AASRA). Update these for your
region before deploying.

## 📁 Project structure

```
src/
├── app/
│   ├── (auth)/            login & signup
│   ├── (app)/             authenticated shell: dashboard, check-in, journal,
│   │                      companion, toolkit, insights, settings
│   ├── api/               route handlers (auth, moods, journal, companion, …)
│   ├── help/              always-accessible crisis resources
│   └── page.tsx           landing page
├── components/            UI: AppShell, MoodChart, BreathingExercise, …
└── lib/
    ├── types.ts           shared domain types
    ├── storage.ts         JSON-file "database"
    ├── auth.ts            sessions & password hashing
    ├── gemma.ts           Ollama/Gemma client + graceful fallbacks
    ├── safety.ts          crisis detection + helplines
    └── utils.ts           shared helpers
```

## Notes

This is a hackathon prototype. For production you would swap the JSON store for
a real database, add a dedicated fine-tuned crisis classifier alongside the
keyword backstop, and host Gemma behind a batched server (vLLM/TGI).
