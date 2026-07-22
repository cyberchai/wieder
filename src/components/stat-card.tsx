"use client";

import { useState } from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: string;
  backContent?: React.ReactNode;
  backTitle?: string;
}

// Heading tint borrowed from the card's own accent, so the row reads as four
// distinct stats instead of four gray labels. Mid-500 shades on purpose: the
// config is darkMode: ['class'], so `dark:` variants would skip the wiederland
// and skunks themes, and 500 is the shade that holds on light and dark alike.
const ACCENT_TEXT: Record<string, string> = {
  "bg-blue-500": "text-blue-500",
  "bg-green-500": "text-green-500",
  "bg-orange-500": "text-orange-500",
  "bg-purple-500": "text-purple-500",
};

type StatFaceProps = Pick<StatCardProps, "title" | "value" | "trend" | "color"> & {
  icon: LucideIcon;
};

function StatFace({ title, value, icon: Icon, trend, color }: StatFaceProps) {
  return (
    <div className="flex items-start justify-between gap-3 h-full">
      <div className="min-w-0">
        <p
          className={cn(
            "text-[0.6875rem] font-bold uppercase tracking-widest",
            ACCENT_TEXT[color] ?? "text-muted-foreground"
          )}
        >
          {title}
        </p>
        <p className="mt-1.5 text-4xl font-extrabold leading-none tracking-tight tabular-nums">
          {value}
        </p>
        {trend && (
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            <span aria-hidden className="text-sm leading-none">
              {trend.isPositive ? "↑" : "↓"}
            </span>
            {trend.value}
          </span>
        )}
      </div>
      <div className={cn("w-12 h-12 shrink-0 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, trend, color, backContent, backTitle }: StatCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const face = <StatFace title={title} value={value} icon={Icon} trend={trend} color={color} />;

  // If no back content, render simple card
  if (!backContent) {
    return <Card className="p-6">{face}</Card>;
  }

  // Flippable card with back content
  return (
    <div 
      className="perspective-1000 h-[140px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div 
        className={cn(
          "relative w-full h-full transition-transform duration-500 transform-style-preserve-3d",
          isFlipped && "rotate-x-180"
        )}
      >
        {/* Front */}
        <Card className="absolute inset-0 p-6 backface-hidden">{face}</Card>

        {/* Back */}
        <Card className="absolute inset-0 p-4 backface-hidden rotate-x-180 overflow-hidden">
          {backTitle && (
            <p
              className={cn(
                "text-[0.6875rem] font-bold uppercase tracking-widest mb-2",
                ACCENT_TEXT[color] ?? "text-muted-foreground"
              )}
            >
              {backTitle}
            </p>
          )}
          <div className="h-full overflow-y-auto">
            {backContent}
          </div>
        </Card>
      </div>
    </div>
  );
}
