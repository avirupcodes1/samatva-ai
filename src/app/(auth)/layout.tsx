import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Already signed in? Skip the auth screens.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / calm panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-accent lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 animate-floaty" />
        <div className="absolute bottom-10 -left-10 h-56 w-56 rounded-full bg-white/10 animate-floaty" />
        <Link href="/" className="relative z-10 text-2xl font-bold text-white">
          Samatva
        </Link>
        <div className="relative z-10 max-w-md text-white">
          <p className="text-3xl font-semibold leading-snug">
            A calm mind is your sharpest study tool.
          </p>
          <p className="mt-4 text-white/80">
            Samatva helps you notice how you feel, breathe through the pressure, and stay steady
            all the way to exam day.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/70">समत्व · equanimity of mind</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
