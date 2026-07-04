"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  SmilePlus,
  NotebookPen,
  MessageCircleHeart,
  Wind,
  LineChart,
  ImageUp,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo, LogoMark } from "./Logo";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/check-in", label: "Check-in", icon: SmilePlus },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/companion", label: "Companion", icon: MessageCircleHeart },
  { href: "/vision", label: "Show & reflect", icon: ImageUp },
  { href: "/toolkit", label: "Toolkit", icon: Wind },
  { href: "/insights", label: "Insights", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const NavLinks = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-primary-soft text-primary-strong"
                : "text-ink-soft hover:bg-surface-soft hover:text-ink",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface p-5 md:flex">
        <Link href="/dashboard" className="mb-8">
          <Logo />
        </Link>
        {NavLinks}
        <div className="mt-auto space-y-2">
          <Link href="/help" className="btn btn-soft w-full">
            <LifeBuoy size={18} />
            Get help now
          </Link>
          <div className="flex items-center gap-3 rounded-[var(--radius-sm)] p-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
              <div className="truncate text-xs text-ink-faint">{user.exam} aspirant</div>
            </div>
            <button onClick={logout} title="Log out" className="text-ink-faint hover:text-danger">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-bold">Samatva</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/help" className="btn btn-soft px-3 py-1.5 text-sm">
              <LifeBuoy size={16} />
              Help
            </Link>
            <button onClick={() => setOpen((o) => !o)} className="p-2 text-ink-soft">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        {/* mobile drawer */}
        {open && (
          <div className="border-b border-border bg-surface p-4 md:hidden">
            {NavLinks}
            <button onClick={logout} className="btn btn-ghost mt-3 w-full">
              <LogOut size={18} />
              Log out
            </button>
          </div>
        )}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
