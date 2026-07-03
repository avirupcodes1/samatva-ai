import { Phone, ShieldAlert } from "lucide-react";
import { HELPLINES } from "@/lib/safety";
import { cn } from "@/lib/utils";

/** A grid/list of crisis helplines. Used on /help and inside crisis alerts. */
export function HelplineList({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("grid gap-3", compact ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
      {HELPLINES.map((h) => (
        <a
          key={h.name}
          href={`tel:${h.phone.replace(/[^\d+]/g, "")}`}
          className="card flex items-center gap-3 p-4 transition hover:shadow-[var(--shadow-lift)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
            <Phone size={18} />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="font-semibold text-ink">{h.name}</span>
              <span className="chip">{h.hours}</span>
            </span>
            <span className="block truncate text-sm text-ink-soft">{h.detail}</span>
            <span className="block font-mono text-sm font-semibold text-primary-strong">
              {h.phone}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}

/**
 * A condensed, height-bounded helpline list for tight layouts (e.g. the chat
 * screen) so it never pushes the conversation off-screen. Single-line rows,
 * internal scroll.
 */
export function CompactHelplines() {
  return (
    <div className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-danger-strong">
        <ShieldAlert size={16} /> You matter — please reach out
      </div>
      <div className="max-h-[32vh] space-y-1.5 overflow-y-auto pr-1">
        {HELPLINES.map((h) => (
          <a
            key={h.name}
            href={`tel:${h.phone.replace(/[^\d+]/g, "")}`}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-surface px-3 py-2 transition hover:bg-surface-soft"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Phone size={14} className="shrink-0 text-primary-strong" />
              <span className="truncate text-sm font-semibold text-ink">{h.name}</span>
              <span className="hidden shrink-0 text-xs text-ink-faint sm:inline">{h.hours}</span>
            </span>
            <span className="shrink-0 font-mono text-sm font-semibold text-primary-strong">
              {h.phone}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * The alert shown in-line whenever the safety layer flags a message.
 * Deliberately prominent, warm and non-clinical.
 */
export function CrisisAlert({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft p-4">
      <div className="mb-2 flex items-center gap-2 font-semibold text-danger-strong">
        <ShieldAlert size={18} />
        You matter — please reach out
      </div>
      <p className="mb-3 text-sm leading-relaxed text-ink">{message}</p>
      <HelplineList compact />
    </div>
  );
}
