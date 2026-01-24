"use client";

import Link from "next/link";
import { useState } from "react";
import { IterationCcw, Loader2 } from 'lucide-react';
import { PublicRoute } from "@/providers/auth-provider";
import PolyWorldBackground from "@/components/poly-world-background";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFlipTransition } from "@/providers/flip-transition-provider";
import type { AuthError } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { triggerFlip } = useFlipTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      triggerFlip();
      setTimeout(() => {
        router.push("/dashboard");
        toast({ title: "login successful", description: "welcome!" });
      }, 400);
    } catch (error) {
      const err = error as AuthError;
      toast({
        title: "Google Sign-In Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <PublicRoute>
      <div className="flex min-h-screen flex-col items-center justify-center p-4 relative">
        <PolyWorldBackground />
        <div className="absolute top-4 left-4 z-10">
          <Link href="/" className="flex items-center justify-center gap-2 text-lg font-bold text-[#59332e] drop-shadow-sm" prefetch={false}>
            <IterationCcw className="h-6 w-6 text-[#59332e]" />
            wieder
          </Link>
        </div>
        <div className="relative z-10">
          <Card className="w-full max-w-sm bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-[#59332e]">
                log in to join your peers
              </CardTitle>
              <CardDescription className="text-[#59332e]/70">
                study together with flashcards
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button 
                variant="outline" 
                className="w-full bg-white hover:bg-gray-50 text-[#59332e] border-[#59332e]/20 hover:border-[#59332e]/40 transition-all"
                onClick={handleGoogleSignIn} 
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                sign in with google
              </Button>
            </CardContent>
          </Card>
        </div>
        <p className="mt-4 text-center text-sm text-[#59332e]/70 relative z-10 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
          for issues, questions or comments {" "}
          <Link href="https://chairaharder.com" className="underline underline-offset-4 hover:text-[#59332e]">
            reach out to me
          </Link>
        </p>
      </div>
    </PublicRoute>
  );
}
