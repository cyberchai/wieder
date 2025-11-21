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

const TIMER_STORAGE_KEY = 'wieder-countdown-timer';

interface TimerState {
  endTimestamp: number; // Unix timestamp when timer should end
  pausedAt: number | null; // Unix timestamp when paused, or null if not paused
  pausedRemaining: number | null; // Remaining seconds when paused
}

export function CountdownTimer() {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerStateRef = useRef<TimerState | null>(null);

  // Save timer state to localStorage
  const saveTimerState = (state: TimerState | null) => {
    if (state) {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
      timerStateRef.current = state;
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
      timerStateRef.current = null;
    }
  };

  const clearTimerState = () => {
    setTimeRemaining(null);
    setIsPaused(false);
    saveTimerState(null);
  };

  // Load timer state from localStorage on mount and sync periodically
  useEffect(() => {
    const loadTimerState = () => {
      try {
        const stored = localStorage.getItem(TIMER_STORAGE_KEY);
        if (stored) {
          const state: TimerState = JSON.parse(stored);
          timerStateRef.current = state;

          if (state.pausedAt !== null && state.pausedRemaining !== null) {
            // Timer is paused
            setTimeRemaining(state.pausedRemaining);
            setIsPaused(true);
          } else {
            // Timer is running - calculate remaining time
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((state.endTimestamp - now) / 1000));
            if (remaining > 0) {
              setTimeRemaining(remaining);
              setIsPaused(false);
            } else {
              // Timer has expired
              clearTimerState();
            }
          }
        }
      } catch (error) {
        console.error('Failed to load timer state:', error);
        clearTimerState();
      }
    };

    loadTimerState();

    // Sync timer state when page becomes visible (handles tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTimerState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic sync to catch any drift (every 10 seconds)
    const syncInterval = setInterval(() => {
      if (timerStateRef.current) {
        const state = timerStateRef.current;
        // Only sync if timer is running (not paused)
        if (state.pausedAt === null) {
          loadTimerState();
        }
      }
    }, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(syncInterval);
    };
  }, []);

  // Main timer effect
  useEffect(() => {
    if (timeRemaining === null || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (timeRemaining <= 0) {
      clearTimerState();
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
        const newRemaining = prev - 1;
        
        // Update stored state if we have one
        if (timerStateRef.current && !isPaused) {
          const now = Date.now();
          const newState: TimerState = {
            endTimestamp: now + (newRemaining * 1000),
            pausedAt: null,
            pausedRemaining: null,
          };
          saveTimerState(newState);
        }
        
        return newRemaining;
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
    const now = Date.now();
    const endTimestamp = now + (minutes * 60 * 1000);
    const state: TimerState = {
      endTimestamp,
      pausedAt: null,
      pausedRemaining: null,
    };
    saveTimerState(state);
    setTimeRemaining(minutes * 60);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPaused) {
      // Resume: calculate new end timestamp based on remaining time
      if (timeRemaining !== null) {
        const now = Date.now();
        const endTimestamp = now + (timeRemaining * 1000);
        const state: TimerState = {
          endTimestamp,
          pausedAt: null,
          pausedRemaining: null,
        };
        saveTimerState(state);
        setIsPaused(false);
      }
    } else {
      // Pause: store current remaining time
      if (timeRemaining !== null) {
        const now = Date.now();
        const state: TimerState = {
          endTimestamp: timerStateRef.current?.endTimestamp || now + (timeRemaining * 1000),
          pausedAt: now,
          pausedRemaining: timeRemaining,
        };
        saveTimerState(state);
        setIsPaused(true);
      }
    }
  };

  const stopTimer = () => {
    clearTimerState();
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


