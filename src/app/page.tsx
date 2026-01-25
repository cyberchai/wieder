"use client"

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Show landing page while:
  // 1. Auth is still loading (checking Firebase session)
  // 2. User is not authenticated
  // Authenticated users will be redirected above
  return (
    <iframe
      src="/landing-bg.html"
      className="w-full h-screen border-0"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none'
      }}
      title="Wieder Landing Page"
    />
  )
}
