"use client";

import { useEffect, useState, ReactNode, useRef } from "react";
import { usePathname } from "next/navigation";
import { useFlipTransition } from "@/providers/flip-transition-provider";

type FlashcardFlipTransitionProps = {
  children: ReactNode;
};

export function FlashcardFlipTransition({
  children,
}: FlashcardFlipTransitionProps) {
  const { isFlipping, resetFlip } = useFlipTransition();
  const pathname = usePathname();
  const [showFlipIn, setShowFlipIn] = useState(false);
  const [isReverse, setIsReverse] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);
  const hasJustFlippedRef = useRef(false);

  // Handle flip out animation (from login page or from dashboard)
  useEffect(() => {
    if (isFlipping) {
      hasJustFlippedRef.current = true;
      // Determine if this is a reverse flip (logout) or forward flip (login)
      const isLogout = prevPathnameRef.current === "/dashboard" || 
                      prevPathnameRef.current?.startsWith("/dashboard") ||
                      prevPathnameRef.current === "/profile";
      setIsReverse(isLogout);
      
      // Reset after animation completes
      const timer = setTimeout(() => {
        resetFlip();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isFlipping, resetFlip]);

  // Handle flip in animation (to dashboard or to landing page)
  useEffect(() => {
    // Check if we just navigated to dashboard from login
    if (pathname === "/dashboard" && prevPathnameRef.current === "/login" && hasJustFlippedRef.current) {
      setShowFlipIn(true);
      setIsReverse(false);
      hasJustFlippedRef.current = false;
      const timer = setTimeout(() => {
        setShowFlipIn(false);
      }, 800);
      prevPathnameRef.current = pathname;
      return () => clearTimeout(timer);
    }
    
    // Check if we just navigated to landing page from dashboard/profile (logout)
    if ((pathname === "/" || pathname === "/login") && 
        (prevPathnameRef.current === "/dashboard" || 
         prevPathnameRef.current?.startsWith("/dashboard") ||
         prevPathnameRef.current === "/profile") && 
        hasJustFlippedRef.current) {
      setShowFlipIn(true);
      setIsReverse(true);
      hasJustFlippedRef.current = false;
      const timer = setTimeout(() => {
        setShowFlipIn(false);
      }, 800);
      prevPathnameRef.current = pathname;
      return () => clearTimeout(timer);
    }
    
    prevPathnameRef.current = pathname;
  }, [pathname]);

  return (
    <div className="flashcard-flip-wrapper">
      <div
        className={`flashcard-flip-inner ${
          isFlipping ? (isReverse ? "flashcard-flip-active-reverse" : "flashcard-flip-active") : ""
        } ${showFlipIn ? (isReverse ? "flashcard-flip-in-reverse" : "flashcard-flip-in") : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

