"use client";

import { Trophy } from 'lucide-react';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Leaderboard } from './leaderboard';

export function LeaderboardButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trophy className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Leaderboard</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="p-0 border-0 bg-transparent shadow-none w-[calc(100vw-2rem)] sm:w-96"
      >
        <Leaderboard />
      </PopoverContent>
    </Popover>
  );
}
