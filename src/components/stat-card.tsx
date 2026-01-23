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

export function StatCard({ title, value, icon: Icon, trend, color, backContent, backTitle }: StatCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // If no back content, render simple card
  if (!backContent) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-semibold mb-2">{value}</p>
            {trend && (
              <span
                className={`text-sm ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>
    );
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
        <Card className="absolute inset-0 p-6 backface-hidden">
          <div className="flex items-center justify-between h-full">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-3xl font-semibold mb-2">{value}</p>
              {trend && (
                <span
                  className={`text-sm ${
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.isPositive ? "↑" : "↓"} {trend.value}
                </span>
              )}
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        {/* Back */}
        <Card className="absolute inset-0 p-4 backface-hidden rotate-x-180 overflow-hidden">
          {backTitle && (
            <p className="text-xs font-medium text-muted-foreground mb-2">{backTitle}</p>
          )}
          <div className="h-full overflow-y-auto">
            {backContent}
          </div>
        </Card>
      </div>
    </div>
  );
}
