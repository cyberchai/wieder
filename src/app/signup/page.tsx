import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AppWindow } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center justify-center gap-2 text-lg font-bold" prefetch={false}>
          <AppWindow className="h-6 w-6 text-primary" />
          Wieder
        </Link>
      </div>
      <AuthForm mode="signup" />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Have a question/concern about this site?{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Contact us
        </Link>
      </p>
    </div>
  );
}
