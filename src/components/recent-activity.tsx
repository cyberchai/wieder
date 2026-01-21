"use client"

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trophy, Flame, Star, ThumbsUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface Activity {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  deck: string;
  timestamp: string;
  type: "achievement" | "edit" | "game" | "study" | "social";
  likes?: number;
  comments?: number;
}

interface RecentActivityProps {
  activities: Activity[];
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function RecentActivity({ activities, isVisible, onToggleVisibility }: RecentActivityProps) {
  const [likedActivities, setLikedActivities] = useState<Set<string>>(new Set());
  
  const toggleLike = (activityId: string) => {
    setLikedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "game":
        return <Flame className="w-4 h-4 text-orange-500" />;
      case "social":
        return <Star className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Activity</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          className="gap-2"
        >
          {isVisible ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show
            </>
          )}
        </Button>
      </div>
      {isVisible && (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex flex-col gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-9 h-9 ring-2 ring-offset-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        {activity.action}{" "}
                        <span className="font-medium text-primary">{activity.deck}</span>
                      </p>
                      {getActivityIcon(activity.type)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 ml-12 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => toggleLike(activity.id)}
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 transition-all ${
                        likedActivities.has(activity.id) 
                          ? "fill-red-500 text-red-500" 
                          : "text-muted-foreground"
                      }`} 
                    />
                    <span className={likedActivities.has(activity.id) ? "text-red-500" : "text-muted-foreground"}>
                      {(activity.likes || 0) + (likedActivities.has(activity.id) ? 1 : 0)}
                    </span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                    <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{activity.comments || 0}</span>
                  </Button>
                  {activity.type === "achievement" && (
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                      <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Congrats!</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
