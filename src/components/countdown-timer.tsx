"use client";

import { useState, useEffect, useRef } from 'react';
import { Timer, Pause, Play, Square } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function CountdownTimer() {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeRemaining === null || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (timeRemaining <= 0) {
      setTimeRemaining(null);
      setIsPaused(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timeRemaining, isPaused]);

  const startTimer = (minutes: number) => {
    setTimeRemaining(minutes * 60);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const stopTimer = () => {
    setTimeRemaining(null);
    setIsPaused(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isActive = timeRemaining !== null && timeRemaining > 0;

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
          <span className="text-sm font-mono font-medium">
            {formatTime(timeRemaining)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={togglePause}
          >
            {isPaused ? (
              <Play className="h-3 w-3" />
            ) : (
              <Pause className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={stopTimer}
          >
            <Square className="h-3 w-3" />
          </Button>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Timer</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Set Timer</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => startTimer(5)}>
            5 minutes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => startTimer(10)}>
            10 minutes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => startTimer(25)}>
            25 minutes
          </DropdownMenuItem>
          {isActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={togglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={stopTimer}>
                Stop Timer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

