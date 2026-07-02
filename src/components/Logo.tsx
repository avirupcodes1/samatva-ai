import { cn } from "@/lib/utils";

/** Samatva brand mark — a balanced leaf/drop, evoking calm & equilibrium. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="samatva-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#7c6ce0" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#samatva-grad)" opacity="0.14" />
      <path
        d="M20 6c6 5 9 9.5 9 14.2C29 26 25 30 20 30s-9-4-9-9.8C11 15.5 14 11 20 6z"
        fill="url(#samatva-grad)"
      />
      <path d="M20 11v16" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-xl font-bold tracking-tight text-ink">
        Samatva
      </span>
    </span>
  );
}
