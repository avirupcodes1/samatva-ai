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
