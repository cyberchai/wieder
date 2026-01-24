"use client";

import { useState } from "react";
import { LucideIcon, Play, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FlashcardSet {
  id: string;
  title: string;
  cards?: unknown[];
}

interface GameModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  players?: string;
  sets?: FlashcardSet[]; // Available sets to choose from
  onClick?: () => void; // Optional custom onClick handler
}

export function GameModeCard({
  title,
  description,
  icon: Icon,
  color,
  sets = [],
  onClick,
}: GameModeCardProps) {
  const router = useRouter();
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (sets.length > 0) {
      setIsSelectDialogOpen(true);
    }
  };

  const handleSelectSet = (setId: string) => {
    setIsSelectDialogOpen(false);
    if (title === "Raining Words") {
      router.push(`/sets/${setId}/play`);
    } else if (title === "Speed") {
      router.push(`/sets/${setId}/speed`);
    } else {
      // Default to study page for other game modes
      router.push(`/sets/${setId}/study`);
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {/* Slide-in Play Button */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out">
          <Button 
            size="lg" 
            className="h-full rounded-none px-6 gap-2"
            onClick={handlePlay}
          >
            <Play className="w-5 h-5" />
            Play
          </Button>
        </div>
      </Card>

      {/* Set Selection Dialog */}
      <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background hover:bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`w-5 h-5`} />
              {title}
            </DialogTitle>
            <DialogDescription>
              Choose a flashcard set to play with
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2">
              {sets.length > 0 ? (
                sets.map((set) => (
                  <Button
                    key={set.id}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent hover:text-accent-foreground hover:scale-100 hover:shadow-sm"
                    onClick={() => handleSelectSet(set.id)}
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{set.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {Array.isArray(set.cards) ? set.cards.length : 0} cards
                      </p>
                    </div>
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sets available. Create a set first!
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
