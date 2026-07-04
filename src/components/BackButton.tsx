"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Returns to the previous page in history (so a logged-in user lands back in
 * the app, not the marketing page). Falls back to a default if there's no
 * in-app history (e.g. a direct visit).
 */
export function BackButton({ fallback = "/dashboard" }: { fallback?: string }) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      onClick={goBack}
      className="mb-6 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
    >
      <ArrowLeft size={16} /> Back
    </button>
  );
}
