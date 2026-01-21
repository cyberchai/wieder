import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GameModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  players: string;
}

export function GameModeCard({
  title,
  description,
  icon: Icon,
  color,
  players,
}: GameModeCardProps) {
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
        <Button size="sm" variant="outline">
          Play
        </Button>
      </div>
    </Card>
  );
}
