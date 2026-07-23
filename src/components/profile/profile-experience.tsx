"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut, Settings, Volume2, VolumeX } from "lucide-react";
import { WiederCreature, type CreatureVariant, type Pointer } from "./wieder-creature";
import { SettingsDialog } from "@/components/settings-dialog";
import { cn } from "@/lib/utils";

export interface ProfileAspect {
  id: string;
  value: string; // big headline
  name: string; // creature name (letter-spaced caps)
  tagline: string; // line under the name
  variant: CreatureVariant;
  bg: string;
  comingSoon?: boolean;
}

const INK = "#191712";

// A tiny self-contained "blip" via the Web Audio API — no asset needed.
let audioCtx: AudioContext | null = null;
function blip(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 520;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    osc.start(t);
    osc.frequency.exponentialRampToValueAtTime(760, t + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.stop(t + 0.18);
  } catch {
    /* audio is a nice-to-have; ignore failures */
  }
}

// Our wordmark SVG, masked so it takes the current text color (dark ink) and
// stays legible on every pastel background.
const logoStyle: React.CSSProperties = {
  aspectRatio: "1307 / 276",
  backgroundColor: "currentColor",
  WebkitMaskImage: "url('/wieder-logo.svg')",
  maskImage: "url('/wieder-logo.svg')",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
};

export function ProfileExperience({
  aspects,
  userName,
  onSignOut,
}: {
  aspects: ProfileAspect[];
  userName?: string;
  onSignOut: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [sound, setSound] = useState(true);
  const [pointer, setPointer] = useState<Pointer | null>(null);
  const active = aspects[index] ?? aspects[0];

  const go = useCallback(
    (next: number) => {
      setIndex((prev) => {
        const n = ((next % aspects.length) + aspects.length) % aspects.length;
        if (n !== prev) blip(sound);
        return n;
      });
    },
    [aspects.length, sound]
  );

  // ← / → to switch drivers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  // rAF-throttled pointer for the googly-eye tracking
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPointer({ x: e.clientX, y: e.clientY }));
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: active.bg, color: INK }}
    >
      <style>{`
        @keyframes wc-float {0%,100%{transform:translate(0,0)}50%{transform:translate(var(--wc-dx,0),var(--wc-dy,0))}}
        .wc-dot{animation:wc-float var(--wc-dur,4s) ease-in-out infinite;animation-delay:var(--wc-delay,0s)}
        .wc-dock{scrollbar-width:none}
        .wc-dock::-webkit-scrollbar{display:none}
        @media (prefers-reduced-motion:reduce){.wc-dot{animation:none}}
      `}</style>

      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/dashboard" aria-label="wieder home" className="flex items-center">
          <span className="block h-5 sm:h-6" style={logoStyle} />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() =>
              setSound((s) => {
                const next = !s;
                if (next) blip(true); // audible confirmation when enabling
                return next;
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-black/90 px-3 py-1.5 text-xs font-bold tracking-wide text-white sm:px-3.5"
          >
            {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            SOUND: {sound ? "ON" : "OFF"}
          </button>
          <SettingsDialog
            trigger={
              <button className="inline-flex items-center gap-1.5 rounded-full border border-black/20 px-3 py-1.5 text-xs font-bold tracking-wide hover:bg-black/5">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">settings</span>
              </button>
            }
          />
          <button
            onClick={onSignOut}
            title="Sign out"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/20 px-3 py-1.5 text-xs font-bold tracking-wide hover:bg-black/5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">sign out</span>
          </button>
        </div>
      </header>

      {/* Hero — flex-1 so it centers in the space above the dock, never under it */}
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] opacity-60 sm:mb-4 sm:text-sm">
          ( {userName ? `${userName}'s` : "your"} wieder profile )
        </p>

        <AnimatePresence mode="wait">
          <motion.h1
            key={`v-${active.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "max-w-[15ch] text-[clamp(2.25rem,8vw,6rem)] font-black leading-[0.92] tracking-tight",
              active.comingSoon && "opacity-45"
            )}
          >
            {active.value}
          </motion.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`c-${active.id}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="my-4 sm:my-6"
          >
            <WiederCreature
              variant={active.variant}
              pointer={pointer}
              className="h-[min(40vw,32vh,240px)] w-[min(40vw,32vh,240px)]"
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`n-${active.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-lg font-black uppercase tracking-[0.35em] sm:text-2xl">
              {active.name}
            </h2>
            <p className="mt-1 max-w-[90vw] font-mono text-xs lowercase opacity-60 sm:text-sm">
              {active.tagline}
            </p>
            {active.comingSoon && (
              <span className="mt-3 rounded-full border border-black/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
                in development
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Driver dock */}
      <div className="flex shrink-0 justify-center px-3 pb-2">
        <div className="wc-dock flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-black/90 p-1.5 shadow-2xl sm:gap-1.5">
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {aspects.map((a, i) => (
            <button
              key={a.id}
              onClick={() => go(i)}
              aria-label={a.name}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full transition-all sm:h-9 sm:w-9",
                i === index ? "scale-110 ring-2 ring-white" : "opacity-70 hover:opacity-100"
              )}
              style={{ backgroundColor: a.bg }}
            >
              <WiederCreature variant={a.variant} animated={false} className="h-full w-full" />
            </button>
          ))}
          <button
            onClick={() => go(index + 1)}
            aria-label="Next"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Link
            href="/dashboard"
            className="ml-1 hidden shrink-0 items-center rounded-full bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90 sm:inline-flex"
          >
            to dashboard →
          </Link>
        </div>
      </div>

      {/* Footer hint */}
      <footer className="flex shrink-0 items-center justify-between px-6 pb-4 font-mono text-[10px] uppercase tracking-widest opacity-50 sm:text-xs">
        <span>
          {index + 1} / {aspects.length}
        </span>
        <span className="hidden sm:inline">← / → to switch</span>
      </footer>
    </div>
  );
}
