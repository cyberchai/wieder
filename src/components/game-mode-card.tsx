import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface GameModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  players: string;
  setId?: string; // Optional setId for game modes that need it
  onClick?: () => void; // Optional custom onClick handler
}

export function GameModeCard({
  title,
  description,
  icon: Icon,
  color,
  players,
  setId,
  onClick,
}: GameModeCardProps) {
  const router = useRouter();

  const handlePlay = () => {
    if (onClick) {
      onClick();
    } else if (setId && title === "Raining Words") {
      // Link Raining Words to the play page for the current set
      router.push(`/sets/${setId}/play`);
    }
    // Other game modes can have their own handlers added later
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{players}</span>
        <Button size="sm" variant="outline" onClick={handlePlay}>
          Play
        </Button>
      </div>
    </Card>
  );
}
