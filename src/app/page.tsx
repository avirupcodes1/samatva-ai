import Link from "next/link";
import { redirect } from "next/navigation";
import {
  SmilePlus,
  NotebookPen,
  MessageCircleHeart,
  Wind,
  LineChart,
  ShieldCheck,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  { icon: SmilePlus, title: "Daily check-ins", body: "A 10-second pulse on your mood, energy, stress and sleep." },
  { icon: MessageCircleHeart, title: "AI companion", body: "A warm, private companion to talk to whenever the pressure builds." },
  { icon: NotebookPen, title: "Guided journaling", body: "Write it out and get a gentle, encouraging reflection back." },
  { icon: Wind, title: "Calm toolkit", body: "Breathing, grounding and focus timers for the tough moments." },
  { icon: LineChart, title: "Insights", body: "See how your well-being tracks against your study load and exam." },
  { icon: ShieldCheck, title: "Safety first", body: "A built-in safety net that surfaces real help when you need it." },
];

export default async function LandingPage() {
  // Signed-in users should land in the app, not the marketing page.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
          <Link href="/signup" className="btn btn-primary">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-primary-soft/60 blur-3xl" />
        <div className="absolute -left-20 top-40 h-80 w-80 rounded-full bg-accent-soft/60 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="chip mb-4 bg-accent-soft text-accent">
              <HeartHandshake size={14} /> Mental well-being for exam aspirants
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              Stay calm and steady, all the way to exam day.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              High-stakes prep is intense. <strong className="text-ink">Samatva</strong> helps you
              monitor how you feel, ease the stress with proven techniques, and talk to a caring AI
              companion — so your mind stays as prepared as your syllabus.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary">
                Start free <ArrowRight size={18} />
              </Link>
              <Link href="/help" className="btn btn-ghost">I need help now</Link>
            </div>
            <p className="mt-4 text-sm text-ink-faint">
              समत्व — equanimity. A balanced mind is your sharpest tool.
            </p>
          </div>

          {/* Calm visual */}
          <div className="relative hidden justify-center lg:flex">
            <div className="relative flex h-80 w-80 items-center justify-center">
              <span className="absolute h-full w-full rounded-full bg-gradient-to-br from-primary to-accent opacity-20 animate-floaty" />
              <span className="absolute h-64 w-64 rounded-full bg-gradient-to-br from-primary to-accent opacity-30" />
              <span className="absolute h-44 w-44 rounded-full bg-gradient-to-br from-primary to-accent opacity-60" />
              <span className="relative text-6xl">🧘</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
          Everything you need to stay grounded
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-soft">
          Simple, gentle tools designed around the real pressures of competitive exam prep.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-primary-soft text-primary-strong">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety strip */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="card flex flex-col items-start gap-4 bg-primary-soft/40 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 shrink-0 text-primary-strong" />
            <div>
              <h3 className="font-semibold text-ink">You&apos;re never on your own</h3>
              <p className="mt-1 max-w-xl text-sm text-ink-soft">
                Samatva is a supportive companion, not a replacement for professional care. If
                things ever feel overwhelming, real helplines are always one tap away.
              </p>
            </div>
          </div>
          <Link href="/help" className="btn btn-soft shrink-0">View helplines</Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-ink-faint sm:flex-row">
          <Logo className="[&_span]:text-base" />
          <p>Built with care · Gemma-powered · A calmer exam journey</p>
        </div>
      </footer>
    </div>
  );
}
