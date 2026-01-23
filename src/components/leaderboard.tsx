"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Crown, Trophy, Medal, Sparkles } from "lucide-react";
import { useLeaderboard } from "@/hooks/use-stats-queries";
import { useAuth } from "@/providers/auth-provider";
import { getUserProfilesBatch } from "@/services/users";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Leaderboard() {
  const { user } = useAuth();
  const { data: leaderboard = [], isLoading } = useLeaderboard();

  // Fetch user profiles for display names and avatars
  const uids = useMemo(() => leaderboard.map(stat => stat.uid), [leaderboard]);
  
  const { data: userProfiles = new Map() } = useQuery({
    queryKey: ['leaderboard-profiles', uids],
    queryFn: () => getUserProfilesBatch(uids),
    enabled: uids.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400 fill-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600 fill-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
      case 2:
        return "bg-gray-400/20 text-gray-600 border-gray-400/30";
      case 3:
        return "bg-amber-600/20 text-amber-600 border-amber-600/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No rankings yet. Start studying to climb the leaderboard!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Leaderboard
        </CardTitle>
        <p className="text-xs text-muted-foreground">Top 20 by Wieds (XP)</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {leaderboard.map((stat, index) => {
              const rank = index + 1;
              const profile = userProfiles.get(stat.uid);
              const displayName = profile?.displayName || profile?.email?.split('@')[0] || "Anonymous";
              const avatar = profile?.photoURL;
              const isCurrentUser = stat.uid === user?.uid;

              return (
                <div
                  key={stat.uid}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    isCurrentUser
                      ? "bg-primary/10 border-2 border-primary/30 shadow-md"
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    {getRankIcon(rank) || (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className={cn(
                    "h-10 w-10 ring-2 ring-offset-2",
                    rank === 1 && "ring-yellow-500/50",
                    rank === 2 && "ring-gray-400/50",
                    rank === 3 && "ring-amber-600/50",
                    isCurrentUser && "ring-primary/50"
                  )}>
                    <AvatarImage src={avatar} />
                    <AvatarFallback>
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isCurrentUser && "text-primary font-semibold"
                      )}>
                        {isCurrentUser ? "You" : displayName}
                      </p>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">
                        {stat.wieds.toLocaleString()} Wieds
                      </span>
                    </div>
                  </div>

                  {/* Rank Badge */}
                  {rank <= 3 && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-semibold", getRankBadgeColor(rank))}
                    >
                      #{rank}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
