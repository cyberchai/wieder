"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { IterationCcw } from 'lucide-react';
import { PublicRoute } from "@/providers/auth-provider";

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="absolute top-4 left-4">
          <Link href="/" className="flex items-center justify-center gap-2 text-lg font-bold" prefetch={false}>
            <IterationCcw className="h-6 w-6 text-primary" />
            wieder
          </Link>
        </div>
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          for issues, questions or comments {" "}
          <Link href="https://chairaharder.com" className="underline underline-offset-4 hover:text-primary">
            reach out to me
          </Link>
        </p>
        {/* <p className="mt-4 text-center text-sm text-muted-foreground">
          sign in with your smith email
        </p> */}
      </div>
    </PublicRoute>
  );
}
