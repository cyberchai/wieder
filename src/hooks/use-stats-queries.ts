import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import {
  getUserStats,
  getLeaderboard,
  getUserRank,
  trackCardStudied,
  trackGamePlayed,
  type UserStats,
} from "@/services/stats";

// Query key factory
export const statsKeys = {
  all: ["stats"] as const,
  user: (uid: string) => [...statsKeys.all, "user", uid] as const,
  leaderboard: () => [...statsKeys.all, "leaderboard"] as const,
  rank: (uid: string) => [...statsKeys.all, "rank", uid] as const,
};

// Get current user's stats
export const useUserStats = () => {
  const { user } = useAuth();
  
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

// Get current user's rank
export const useUserRank = () => {
  const { user } = useAuth();
  
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => trackCardStudied(user!.uid),
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => trackGamePlayed(user!.uid),
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
