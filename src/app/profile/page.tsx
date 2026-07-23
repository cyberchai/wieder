"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth, ProtectedRoute } from "@/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useFlipTransition } from "@/providers/flip-transition-provider";
import { useUserStats, useUserRank } from "@/hooks/use-stats-queries";
import { getUserProgressTotals } from "@/services/set-progress";
import { schoolFromEmail } from "@/lib/school-from-email";
import {
  ProfileExperience,
  type ProfileAspect,
} from "@/components/profile/profile-experience";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { triggerFlip } = useFlipTransition();

  const { data: stats } = useUserStats();
  const { data: rank } = useUserRank();
  const { data: totals } = useQuery({
    queryKey: ["progress-totals", user?.uid ?? ""],
    queryFn: () => getUserProgressTotals(user!.uid),
    enabled: !!user,
    staleTime: 60_000,
  });

  // "Best rank ever" isn't stored server-side yet, so keep a local best-seen
  // proxy that only ever improves (lower number = better).
  const [bestRank, setBestRank] = useState<number | null>(null);
  useEffect(() => {
    if (rank == null) return;
    const stored = Number(localStorage.getItem("wieder_best_rank"));
    const best = stored && stored > 0 ? Math.min(stored, rank) : rank;
    localStorage.setItem("wieder_best_rank", String(best));
    setBestRank(best);
  }, [rank]);

  // Best game: no gameResults collection yet, so surface the real Match Pairs
  // best time from localStorage if it exists, otherwise a friendly stub.
  const [bestGame, setBestGame] = useState<{ value: string; tagline: string }>({
    value: "—",
    tagline: "play a game to set a record",
  });
  useEffect(() => {
    try {
      let best = Infinity;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("matchPairs_") && key.endsWith("_bestTime")) {
          const v = Number(localStorage.getItem(key));
          if (v > 0 && v < best) best = v;
        }
      }
      if (best !== Infinity) {
        setBestGame({ value: `${best}s`, tagline: "match pairs · your fastest run" });
      }
    } catch {
      /* localStorage may be unavailable; keep the stub */
    }
  }, []);

  const aspects = useMemo<ProfileAspect[]>(() => {
    const school = schoolFromEmail(user?.email);
    const cards = stats?.cardsStudied ?? 0;
    const graded = totals ? totals.strong + totals.weak : 0;
    const accuracy = graded > 0 ? Math.round((totals!.strong / graded) * 100) : null;

    const created = user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime)
      : stats?.createdAt ?? null;
    const sinceShort = created
      ? created.toLocaleString("en-US", { month: "short", year: "numeric" })
      : "—";
    const sinceFull = created
      ? created.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "the beginning";

    return [
      {
        id: "campus",
        value: school.name,
        name: "SCHOOL",
        tagline: school.domain || "your home base",
        variant: "halo",
        bg: "#f2e2b3",
      },
      {
        id: "practice",
        value: cards.toLocaleString(),
        name: "PRACTICE",
        tagline: cards === 1 ? "card practiced" : "cards practiced",
        variant: "scatter",
        bg: "#c6cbf6",
      },
      {
        id: "accuracy",
        value: accuracy != null ? `${accuracy}%` : "—",
        name: "PRECISION",
        tagline: accuracy != null ? "answer accuracy" : "no graded cards yet",
        variant: "vortex",
        bg: "#bfe4f2",
      },
      {
        id: "arcade",
        value: bestGame.value,
        name: "ARCADE",
        tagline: bestGame.tagline,
        variant: "grid",
        bg: "#bce6cb",
      },
      {
        id: "rank",
        value: bestRank != null ? `#${bestRank}` : "unranked",
        name: "RANK",
        tagline: bestRank != null ? "best leaderboard rank" : "climb the leaderboard",
        variant: "ring",
        bg: "#f6c6dc",
      },
      {
        id: "tenure",
        value: sinceShort,
        name: "TENURE",
        tagline: `wiederer since ${sinceFull}`,
        variant: "nebula",
        bg: "#f7cc9d",
      },
      {
        id: "type",
        value: "Coming soon",
        name: "TYPE",
        tagline: "your wieder profile type",
        variant: "puff",
        bg: "#f4b1a3",
        comingSoon: true,
      },
    ];
  }, [user, stats, totals, bestGame, bestRank]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      triggerFlip();
      setTimeout(() => {
        router.push("/");
        toast({ title: "Signed out successfully." });
      }, 400);
    } catch {
      toast({ title: "Error signing out.", variant: "destructive" });
    }
  };

  const userName = user?.displayName || user?.email?.split("@")[0] || "";

  return (
    <ProtectedRoute>
      <ProfileExperience aspects={aspects} userName={userName} onSignOut={handleSignOut} />
    </ProtectedRoute>
  );
}
