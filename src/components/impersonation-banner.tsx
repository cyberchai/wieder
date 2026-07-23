"use client";

import { useRouter } from "next/navigation";
import { useImpersonation } from "@/providers/impersonation-provider";
import { Button } from "@/components/ui/button";
import { Eye, X, Shield } from "lucide-react";

// Always-visible indicator shown to the superadmin while they view the app as
// another user. Fixed to the bottom-center so it never collides with the
// per-page sticky headers.
export function ImpersonationBanner() {
  const router = useRouter();
  const { isImpersonating, impersonatedUser, stopImpersonation } =
    useImpersonation();

  if (!isImpersonating || !impersonatedUser) return null;

  const name =
    impersonatedUser.displayName || impersonatedUser.email || "a user";

  const handleExit = () => {
    stopImpersonation();
    router.push("/admin");
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-amber-400/40 bg-amber-950/90 px-4 py-2 text-amber-50 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-amber-950/80">
        <Eye className="h-4 w-4 flex-shrink-0 text-amber-300" />
        <span className="text-sm">
          Viewing as{" "}
          <strong className="font-semibold">{name}</strong>
          <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200">
            read-only
          </span>
        </span>
        <div className="mx-1 h-4 w-px bg-amber-400/30" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push("/admin")}
          className="h-7 gap-1 px-2 text-amber-100 hover:bg-amber-400/20 hover:text-amber-50"
        >
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">console</span>
        </Button>
        <Button
          size="sm"
          onClick={handleExit}
          className="h-7 gap-1 bg-amber-400 px-3 text-amber-950 hover:bg-amber-300"
        >
          <X className="h-3.5 w-3.5" />
          Exit
        </Button>
      </div>
    </div>
  );
}
