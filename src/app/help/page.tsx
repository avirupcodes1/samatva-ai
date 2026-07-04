import type { Metadata } from "next";
import { HeartHandshake, Phone } from "lucide-react";
import { HelplineList } from "@/components/Helplines";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Get help now · Samatva",
};

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <BackButton />

      <div className="card p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
          <HeartHandshake size={22} />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">You deserve support right now</h1>
        <p className="mt-2 text-ink-soft">
          If you&apos;re feeling overwhelmed, in distress, or having thoughts of harming yourself,
          please reach out. These lines are free, confidential, and staffed by people who want to
          help. You are not alone.
        </p>

        <div className="mt-4 rounded-[var(--radius-sm)] bg-danger-soft p-4 text-sm text-danger-strong">
          <strong>In immediate danger?</strong> Call emergency services on <strong>112</strong>{" "}
          (India) or go to your nearest hospital.
        </div>

        <h2 className="mt-8 mb-3 flex items-center gap-2 font-semibold text-ink">
          <Phone size={18} /> Helplines
        </h2>
        <HelplineList />

        <p className="mt-8 text-sm text-ink-faint">
          Samatva is a well-being companion and does not provide medical or crisis care. In an
          emergency, always contact professional services.
        </p>
      </div>
    </div>
  );
}
