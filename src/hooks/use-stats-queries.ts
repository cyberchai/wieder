import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useEffectiveUser } from "@/providers/impersonation-provider";
import {
  getUserStats,
  getLeaderboard,
  getUserRank,
  trackCardStudied,
  trackGamePlayed,
  type UserStats,
} from "@/services/stats";
import {
  getSetProgress,
  getUserSetsProgress,
  trackSetCardStudied,
  resetSetProgress,
  setCardPerformance,
  type SetProgress,
  type CardPerformance,
} from "@/services/set-progress";

// Query key factory
export const statsKeys = {
  all: ["stats"] as const,
  user: (uid: string) => [...statsKeys.all, "user", uid] as const,
  leaderboard: () => [...statsKeys.all, "leaderboard"] as const,
  rank: (uid: string) => [...statsKeys.all, "rank", uid] as const,
};

// Query key factory for set progress
export const progressKeys = {
  all: ["setProgress"] as const,
  set: (uid: string, setId: string) => [...progressKeys.all, uid, setId] as const,
  userSets: (uid: string) => [...progressKeys.all, uid, "all"] as const,
};

// Get the effective user's stats (impersonated user when the superadmin is
// viewing someone, otherwise the signed-in user).
export const useUserStats = () => {
  const { user } = useEffectiveUser();

  return useQuery({
    queryKey: statsKeys.user(user?.uid || ""),
    queryFn: () => getUserStats(user!.uid),
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
};

// Get leaderboard (top 20)
export const useLeaderboard = () => {
  return useQuery({
    queryKey: statsKeys.leaderboard(),
    queryFn: () => getLeaderboard(20),
    staleTime: 60000, // 1 minute
  });
};

// Get the effective user's rank
export const useUserRank = () => {
  const { user } = useEffectiveUser();

  return useQuery({
    queryKey: statsKeys.rank(user?.uid || ""),
    queryFn: () => getUserRank(user!.uid),
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });
};

// Track card studied mutation
export const useTrackCardStudied = () => {
  const { user } = useAuth();
  const { isImpersonating } = useEffectiveUser();
  const queryClient = useQueryClient();

  return useMutation({
    // No-op while impersonating: viewing another user must never write data.
    mutationFn: () => (isImpersonating || !user ? Promise.resolve() : trackCardStudied(user.uid)),
    onSuccess: () => {
      // Invalidate and refetch user stats
      if (user) {
        queryClient.invalidateQueries({ queryKey: statsKeys.user(user.uid) });
        queryClient.invalidateQueries({ queryKey: statsKeys.rank(user.uid) });
        queryClient.invalidateQueries({ queryKey: statsKeys.leaderboard() });
      }
    },
  });
};

// Track game played mutation
export const useTrackGamePlayed = () => {
  const { user } = useAuth();
  const { isImpersonating } = useEffectiveUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => (isImpersonating || !user ? Promise.resolve() : trackGamePlayed(user.uid)),
    onSuccess: () => {
      // Invalidate and refetch user stats
      if (user) {
        queryClient.invalidateQueries({ queryKey: statsKeys.user(user.uid) });
        queryClient.invalidateQueries({ queryKey: statsKeys.rank(user.uid) });
        queryClient.invalidateQueries({ queryKey: statsKeys.leaderboard() });
      }
    },
  });
};

// ============================================
// Set Progress Hooks
// ============================================

// Get progress for a single set (effective user)
export const useSetProgress = (setId: string) => {
  const { user } = useEffectiveUser();

  return useQuery({
    queryKey: progressKeys.set(user?.uid || "", setId),
    queryFn: () => getSetProgress(user!.uid, setId),
    enabled: !!user && !!setId,
    staleTime: 30000, // 30 seconds
  });
};

// Get progress for multiple sets (for dashboard, effective user)
export const useUserSetsProgress = (setIds: string[]) => {
  const { user } = useEffectiveUser();

  return useQuery({
    queryKey: progressKeys.userSets(user?.uid || ""),
    queryFn: () => getUserSetsProgress(user!.uid, setIds),
    enabled: !!user && setIds.length > 0,
    staleTime: 30000, // 30 seconds
  });
};

// Track a card studied for a specific set
export const useTrackSetCardStudied = () => {
  const { user } = useAuth();
  const { isImpersonating } = useEffectiveUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ setId, cardId }: { setId: string; cardId: string }) =>
      isImpersonating || !user
        ? Promise.resolve()
        : trackSetCardStudied(user.uid, setId, cardId),
    onSuccess: (_, variables) => {
      // Invalidate set progress queries
      if (user) {
        queryClient.invalidateQueries({ 
          queryKey: progressKeys.set(user.uid, variables.setId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: progressKeys.userSets(user.uid) 
        });
      }
    },
  });
};

// Reset progress for a set
export const useResetSetProgress = () => {
  const { user } = useAuth();
  const { isImpersonating } = useEffectiveUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (setId: string) =>
      isImpersonating || !user ? Promise.resolve() : resetSetProgress(user.uid, setId),
    onSuccess: (_, setId) => {
      // Invalidate set progress queries
      if (user) {
        queryClient.invalidateQueries({ 
          queryKey: progressKeys.set(user.uid, setId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: progressKeys.userSets(user.uid) 
        });
      }
    },
  });
};

// Set card performance (weak/strong/neutral)
export const useSetCardPerformance = () => {
  const { user } = useAuth();
  const { isImpersonating } = useEffectiveUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ setId, cardId, performance }: {
      setId: string;
      cardId: string;
      performance: CardPerformance
    }) =>
      isImpersonating || !user
        ? Promise.resolve()
        : setCardPerformance(user.uid, setId, cardId, performance),
    onSuccess: (_, variables) => {
      // Invalidate set progress queries
      if (user) {
        queryClient.invalidateQueries({ 
          queryKey: progressKeys.set(user.uid, variables.setId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: progressKeys.userSets(user.uid) 
        });
      }
    },
  });
};
