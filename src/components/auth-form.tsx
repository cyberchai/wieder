"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { Loader2 } from "lucide-react";
// import { signInWithRedirect } from 'firebase/auth';

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // await signInWithRedirect(auth, new GoogleAuthProvider());
      router.push("/dashboard");
      toast({ title: "login successful", description: "welcome!" });
    } catch (error: any) {
      toast({
        title: "Google Sign-In Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === "login" ? "welcome!" : "please sign in with your smith email"}</CardTitle>
        <CardDescription>
          {mode === "login" ? "sign in to access your flashcards" : "sign up or log in using your Google account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {mode === 'signup' ? "use Google to login with your Smith email" : "sign in with Google"}
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}
          google
        </Button>
      </CardContent>
    </Card>
  );
}
