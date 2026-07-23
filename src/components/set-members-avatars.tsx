"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSetMembers } from "@/services/users";
import { cn } from "@/lib/utils";

interface SetMembersAvatarsProps {
  setId: string;
  /** Set owner's uid — leads the stack and is fetched alongside joiners */
  ownerId?: string;
  /** Max avatars to show before collapsing the rest into a +N badge */
  max?: number;
  className?: string;
}

/**
 * Stacked, overlapping member avatars for a set that's shared to multiple
 * people (Untitled UI "avatar group" pattern). Falls back to a plain people
 * icon when a set has one member or fewer, so solo sets look unchanged.
 */
export function SetMembersAvatars({
  setId,
  ownerId,
  max = 4,
  className,
}: SetMembersAvatarsProps) {
  const { data: members = [] } = useQuery({
    queryKey: ["set-members", setId],
    queryFn: () => getSetMembers(setId, ownerId),
    enabled: !!setId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Solo (or still-loading) sets keep the original lone people icon
  if (members.length <= 1) {
    return <Users className={cn("h-4 w-4 text-muted-foreground", className)} />;
  }

  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex items-center -space-x-2", className)}>
        {shown.map((member) => (
          <Tooltip key={member.uid}>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 ring-2 ring-card cursor-default">
                <AvatarImage src={member.photoURL} alt={member.displayName} />
                <AvatarFallback className="text-[10px]">
                  {member.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{member.displayName}</TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-card text-[10px] font-medium text-muted-foreground cursor-default">
                +{overflow}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {members.slice(max).map((m) => m.displayName).join(", ")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
