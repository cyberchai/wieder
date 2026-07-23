"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, IterationCcw } from "lucide-react";
import LowPolyLandscapeBackground from "@/components/low-poly-landscape-background";
import { useAuth } from "@/providers/auth-provider";

/**
 * Shared layout for the static info pages (privacy, terms, contribute):
 * the app's low-poly day landscape as a backdrop, a minimal translucent
 * header, and the content floating in a clean frosted card.
 */
export function LegalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();

  // Return the user to wherever they came from (dashboard, a set, the landing)
  // instead of routing through "/", which — when logged in — flashes the
  // landing page before redirecting to the dashboard.
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(user ? "/dashboard" : "/");
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Virtual low-poly landscape backdrop (same world as the app) */}
      <LowPolyLandscapeBackground />

      {/* Minimal header */}
      <header className="sticky top-0 z-50 w-full bg-black/15 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={user ? "/dashboard" : "/"}
            prefetch={false}
            className="flex items-center gap-2 text-white drop-shadow-sm"
          >
            <IterationCcw className="h-6 w-6" />
            <span className="text-lg font-bold lowercase">wieder</span>
          </Link>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            back
          </button>
        </div>
      </header>

      {/* Content card floating over the landscape */}
      <main className="relative z-10 px-4 pb-24 pt-10 sm:pt-14">
        <article className="mx-auto max-w-2xl rounded-3xl bg-white/95 p-8 shadow-2xl ring-1 ring-black/5 backdrop-blur-md sm:p-10 md:p-12">
          {children}
        </article>
      </main>
    </div>
  );
}
