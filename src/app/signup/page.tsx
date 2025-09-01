"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { IterationCcw } from 'lucide-react';
import { PublicRoute } from "@/providers/auth-provider";
import AuroraBackground from "@/components/aurora-background";

export default function SignupPage() {
  return (
    <PublicRoute>
      <div className="flex min-h-screen flex-col items-center justify-center p-4 relative">
        <AuroraBackground />
        <div className="absolute top-4 left-4 z-10">
          <Link href="/" className="flex items-center justify-center gap-2 text-lg font-bold" prefetch={false}>
            <IterationCcw className="h-6 w-6 text-primary" />
            Wieder
          </Link>
        </div>
        <div className="relative z-10">
          <AuthForm mode="signup" />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground relative z-10">
          Have a question/concern about this site?{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Contact us
          </Link>
        </p>
      </div>
    </PublicRoute>
  );
}
