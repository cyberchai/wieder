"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { IterationCcw, Loader2, Mail, Check } from 'lucide-react';
import { PublicRoute } from "@/providers/auth-provider";
import PolyWorldBackground from "@/components/poly-world-background";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFlipTransition } from "@/providers/flip-transition-provider";
import type { AuthError } from "firebase/auth";
import { Suspense } from "react";

const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { triggerFlip } = useFlipTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [isCompletingSignIn, setIsCompletingSignIn] = useState(false);

  // Handle email link sign-in completion
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const completeEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setIsCompletingSignIn(true);
        
        // Try to get email from: 1) URL params, 2) localStorage, 3) prompt user
        let emailForSignIn = searchParams.get("email");
        
        if (!emailForSignIn) {
          emailForSignIn = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
        }
        
        if (!emailForSignIn) {
          // Last resort: prompt user (e.g., opened on different device without URL param)
          emailForSignIn = window.prompt("please enter your email to confirm sign-in");
        }
        
        if (!emailForSignIn) {
          setIsCompletingSignIn(false);
          toast({
            title: "sign-in cancelled",
            description: "email is required to complete sign-in",
            variant: "destructive",
          });
          return;
        }
        
        try {
          await signInWithEmailLink(auth, emailForSignIn, window.location.href);
          // Clear the email from storage
          window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
          
          triggerFlip();
          setTimeout(() => {
            router.push("/dashboard");
            toast({ title: "login successful", description: "welcome!" });
          }, 400);
        } catch (error) {
          const err = error as AuthError;
          let message = err.message;
          if (err.code === "auth/invalid-action-code") {
            message = "This sign-in link has expired or already been used.";
          } else if (err.code === "auth/invalid-email") {
            message = "Please enter the same email you used to request the link.";
          }
          toast({
            title: "sign-in error",
            description: message,
            variant: "destructive",
          });
          setIsCompletingSignIn(false);
        }
      }
    };
    
    completeEmailLinkSignIn();
  }, [router, searchParams, toast, triggerFlip]);

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

  async function handleEmailLinkSignIn(e: React.FormEvent) {
    e.preventDefault();
    setIsEmailLoading(true);
    
    // Include email in the URL so user doesn't have to type it again
    const continueUrl = new URL("/login", window.location.origin);
    continueUrl.searchParams.set("email", email);
    
    const actionCodeSettings = {
      // URL to redirect back to - includes email param for seamless sign-in
      url: continueUrl.toString(),
      handleCodeInApp: true,
    };
    
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Also save to localStorage as backup (same device scenario)
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
      setEmailSent(true);
      toast({ 
        title: "check your email", 
        description: "we sent you a sign-in link" 
      });
    } catch (error) {
      const err = error as AuthError;
      let message = err.message;
      if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/operation-not-allowed") {
        message = "Email link sign-in is not enabled. Please contact support.";
      }
      toast({
        title: "error sending link",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
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
            <CardContent className="pt-4 space-y-4">
              <Button 
                variant="outline" 
                className="w-full bg-white hover:bg-gray-50 text-[#59332e] border-[#59332e]/20 hover:border-[#59332e]/40 transition-all"
                onClick={handleGoogleSignIn} 
                disabled={isGoogleLoading || isEmailLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                sign in with google
              </Button>

              {isCompletingSignIn ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-[#59332e]" />
                  <p className="text-sm text-[#59332e]/70">completing sign-in...</p>
                </div>
              ) : !showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full text-xs text-[#59332e]/60 hover:text-[#59332e] transition-colors flex items-center justify-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  or sign in with email link
                </button>
              ) : emailSent ? (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[#59332e]/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white/90 px-2 text-[#59332e]/50">or</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2 py-4 px-3 bg-green-50/80 rounded-lg border border-green-200/50">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-[#59332e]">check your email</p>
                    <p className="text-xs text-[#59332e]/60 text-center">
                      we sent a sign-in link to<br />
                      <span className="font-medium">{email}</span>
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    className="w-full text-xs text-[#59332e]/60 hover:text-[#59332e] transition-colors"
                  >
                    use a different email
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[#59332e]/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white/90 px-2 text-[#59332e]/50">or</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailLinkSignIn} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs text-[#59332e]/70">email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-9 text-sm bg-white text-[#59332e] placeholder:text-[#59332e]/40 border-[#59332e]/20 focus:border-[#59332e]/40"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full h-9 text-sm bg-white hover:bg-gray-50 text-[#59332e] border-[#59332e]/20 hover:border-[#59332e]/40 transition-all"
                      disabled={isEmailLoading || isGoogleLoading}
                    >
                      {isEmailLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      send sign-in link
                    </Button>
                    <p className="text-[10px] text-[#59332e]/50 text-center">
                      no password needed — we&apos;ll email you a magic link
                    </p>
                  </form>
                </>
              )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#59332e]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
