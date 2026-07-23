"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, ProtectedRoute } from "@/providers/auth-provider";
import {
  getFlashcardSet,
  type FlashcardSet,
  type Card as CardType,
} from "@/services/flashcard-sets";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useTrackGamePlayed } from "@/hooks/use-stats-queries";

type GameState = "idle" | "playing" | "timeout" | "complete";

interface GameCard extends CardType {
  timeLimit: number; // calculated time limit for this card
}

// Calculate time limit: 3s base + 0.5s per character in definition
const calculateTimeLimit = (definition: string): number => {
  const baseTime = 3;
  const perCharTime = 0.5;
  return baseTime + definition.length * perCharTime;
};

// Get background color based on time remaining percentage
const getBackgroundColor = (timePercent: number): string => {
  // Smooth gradient from pastel green -> yellow -> red
  if (timePercent > 50) {
    // Green to Yellow (100% -> 50%)
    const t = (100 - timePercent) / 50; // 0 to 1
    const r = Math.round(144 + t * 111); // 144 -> 255
    const g = Math.round(238 - t * 8);   // 238 -> 230
    const b = Math.round(144 - t * 42);  // 144 -> 102
    return `rgb(${r}, ${g}, ${b})`;
  } else if (timePercent > 25) {
    // Yellow to Orange-Red (50% -> 25%)
    const t = (50 - timePercent) / 25; // 0 to 1
    const r = 255;
    const g = Math.round(230 - t * 123); // 230 -> 107
    const b = Math.round(102 - t * 2);   // 102 -> 100
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Red zone (25% -> 0%)
    const t = timePercent / 25; // 1 to 0
    const r = 255;
    const g = Math.round(70 + t * 37);  // 70 -> 107
    const b = Math.round(70 + t * 37);  // 70 -> 107
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export default function SpeedPage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleCorrectAnswer, handleIncorrectAnswer, handleGameEnded, enableSounds } = useSoundEffects();
  const trackGamePlayed = useTrackGamePlayed();

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const currentCardRef = useRef<GameCard | null>(null);
  const handleTimeoutRef = useRef<() => void>(() => {});

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [gameCards, setGameCards] = useState<GameCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typed, setTyped] = useState("");

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timePercent, setTimePercent] = useState(100);

  // Score tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  // Feedback overlay
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState("");

  const MAX_WORDS = 20;

  // Fetch the flashcard set
  const fetchSet = useCallback(async () => {
    setLoading(true);
    const fetchedSet = await getFlashcardSet(setId);
    if (fetchedSet) {
      if (!fetchedSet.shared && !fetchedSet.isPublic && fetchedSet.userId !== user?.uid) {
        toast({
          title: "Error",
          description: "You don't have permission to view this set.",
          variant: "destructive",
        });
        router.push("/dashboard");
        return;
      }
      setSet(fetchedSet);
    } else {
      toast({
        title: "Error",
        description: "Set not found.",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
    setLoading(false);
  }, [router, setId, toast, user?.uid]);

  useEffect(() => {
    if (setId && user) fetchSet();
  }, [setId, user, fetchSet]);

  // Shuffle and prepare game cards
  const prepareGameCards = useCallback((cards: CardType[]): GameCard[] => {
    if (!cards?.length) return [];
    
    // Shuffle cards
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    
    // Take up to MAX_WORDS cards
    const selected = shuffled.slice(0, MAX_WORDS);
    
    // Add time limits
    return selected.map(card => ({
      ...card,
      timeLimit: calculateTimeLimit(card.back), // back = definition
    }));
  }, []);

  // Start timer for current card
  const startTimer = useCallback((timeLimit: number) => {
    setTimeRemaining(timeLimit);
    setTimePercent(100);

    const startTime = Date.now();
    const endTime = startTime + timeLimit * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, (endTime - now) / 1000);
      const percent = (remaining / timeLimit) * 100;

      setTimeRemaining(remaining);
      setTimePercent(percent);

      if (remaining <= 0) {
        // Time's up! Call via ref to avoid circular dependency
        handleTimeoutRef.current();
      } else {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  }, []);

  // Advance to next card or complete
  const advanceToNext = useCallback(() => {
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex + 1;

      if (nextIndex >= gameCards.length) {
        // Game complete
        setGameState("complete");
        enableSounds();
        handleGameEnded();
        
        if (user) {
          trackGamePlayed.mutate();
        }
        return prevIndex; // Don't change index
      } else {
        setTyped("");
        setGameState("playing");
        currentCardRef.current = gameCards[nextIndex];
        startTimer(gameCards[nextIndex].timeLimit);
        
        // Focus input
        setTimeout(() => inputRef.current?.focus(), 50);
        return nextIndex;
      }
    });
  }, [gameCards, enableSounds, handleGameEnded, startTimer, trackGamePlayed, user]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    enableSounds();
    handleIncorrectAnswer();

    // Use ref to get current card reliably
    const card = currentCardRef.current;
    setLastCorrectAnswer(card?.front || "unknown");
    
    setTotalAttempted(prev => prev + 1);
    setGameState("timeout");

    // Auto-advance after 1.5 seconds
    timerRef.current = setTimeout(() => {
      advanceToNext();
    }, 1500);
  }, [enableSounds, handleIncorrectAnswer, advanceToNext]);

  // Keep the ref updated for use in startTimer
  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  // Check answer on input change
  const checkAnswer = useCallback((input: string) => {
    const currentCard = gameCards[currentIndex];
    if (!currentCard) return;

    const normalizedInput = input.toLowerCase().trim();
    const normalizedAnswer = currentCard.front.toLowerCase().trim();

    if (normalizedInput === normalizedAnswer) {
      // Correct!
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      enableSounds();
      handleCorrectAnswer();
      setCorrectCount(prev => prev + 1);
      setTotalAttempted(prev => prev + 1);

      // Show feedback overlay
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 600);

      // Immediately advance
      const nextIndex = currentIndex + 1;

      if (nextIndex >= gameCards.length) {
        // Game complete
        setGameState("complete");
        handleGameEnded();
        
        if (user) {
          trackGamePlayed.mutate();
        }
      } else {
        setCurrentIndex(nextIndex);
        setTyped("");
        startTimer(gameCards[nextIndex].timeLimit);
        
        // Focus input
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [gameCards, currentIndex, enableSounds, handleCorrectAnswer, handleGameEnded, startTimer, trackGamePlayed, user]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTyped(value);
    checkAnswer(value);
  };

  // Start game
  const startGame = useCallback(() => {
    if (!set?.cards?.length) return;

    const cards = prepareGameCards(set.cards);
    if (cards.length === 0) return;

    setGameCards(cards);
    setCurrentIndex(0);
    setTyped("");
    setCorrectCount(0);
    setTotalAttempted(0);
    setShowFeedback(false);
    setLastCorrectAnswer("");
    currentCardRef.current = cards[0]; // Set ref for first card

    enableSounds();
    setGameState("playing");
    startTimer(cards[0].timeLimit);

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [set, prepareGameCards, enableSounds, startTimer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Current card
  const currentCard = gameCards[currentIndex];

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    currentCardRef.current = currentCard;
  }, [currentCard]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div 
          className="flex flex-col min-h-screen items-center justify-center"
          style={{ backgroundColor: "rgb(144, 238, 144)" }}
        >
          <p className="text-xl text-gray-700">Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!set) {
    return (
      <ProtectedRoute>
        <div 
          className="flex flex-col min-h-screen items-center justify-center"
          style={{ backgroundColor: "rgb(144, 238, 144)" }}
        >
          <p className="text-xl text-gray-700">Set not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div 
        className="flex flex-col min-h-screen transition-colors duration-300"
        style={{ 
          backgroundColor: gameState === "playing" 
            ? getBackgroundColor(timePercent) 
            : "rgb(144, 238, 144)" 
        }}
      >
        {/* Feedback overlay */}
        {showFeedback && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="animate-ping-once text-6xl font-bold text-white drop-shadow-lg opacity-80">
              +1
            </div>
          </div>
        )}

        {/* Idle State */}
        {gameState === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{set.title}</h1>
            <p className="text-xl text-gray-600 mb-8">Speed Mode</p>
            
            <p className="text-gray-600 mb-8 text-center max-w-md">
              Type the term that matches each definition before time runs out.
              The faster you answer, the better!
            </p>

            <Button 
              onClick={startGame} 
              size="lg"
              className="text-xl px-8 py-6 bg-white text-gray-800 hover:bg-gray-100 shadow-lg"
            >
              Start Game
            </Button>

            <Button variant="ghost" asChild className="mt-6 text-gray-600">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        )}

        {/* Playing State */}
        {gameState === "playing" && currentCard && (
          <div className="flex-1 flex flex-col">
            {/* Top bar with timer and progress */}
            <div className="flex justify-between items-center p-4">
              <div className="text-lg font-mono font-cherry-bomb text-gray-800 bg-white/50 px-3 py-1 rounded">
                {timeRemaining.toFixed(1)}s
              </div>
              <div className="text-lg font-semibold font-cherry-bomb text-gray-800 bg-white/50 px-3 py-1 rounded">
                {currentIndex + 1} / {gameCards.length}
              </div>
            </div>

            {/* Definition display */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="text-center mb-12">
                <p className="text-sm uppercase tracking-wide text-gray-600 mb-4">
                  Definition
                </p>
                <p className="text-2xl md:text-4xl font-medium text-gray-800 max-w-2xl leading-relaxed">
                  {currentCard.back}
                </p>
              </div>

              {/* Input area */}
              <div className="w-full max-w-md">
                <Input
                  ref={inputRef}
                  value={typed}
                  onChange={handleInputChange}
                  placeholder="Type the term..."
                  className="text-xl h-14 text-center bg-white/80 border-2 border-white shadow-lg placeholder:text-gray-400"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Score display */}
            <div className="p-4 text-center">
              <p className="text-gray-700 font-cherry-bomb">
                Score: <span className="font-bold">{correctCount}</span> / {totalAttempted}
              </p>
            </div>
          </div>
        )}

        {/* Timeout State */}
        {gameState === "timeout" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-red-100">
            <h2 className="text-3xl font-bold font-cherry-bomb text-red-600 mb-4">Time&apos;s Up!</h2>
            <p className="text-xl text-gray-600 mb-2">The answer was:</p>
            <p className="text-2xl font-bold text-gray-800 mb-8">{lastCorrectAnswer}</p>
            <p className="text-gray-500">Moving to next word...</p>
          </div>
        )}

        {/* Complete State */}
        {gameState === "complete" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h2 className="text-4xl font-bold font-cherry-bomb text-gray-800 mb-4">Game Complete!</h2>

            <div className="text-center mb-8">
              <p className="text-6xl font-bold font-cherry-bomb text-gray-800 mb-2">
                {correctCount} / {totalAttempted}
              </p>
              <p className="text-xl text-gray-600 font-cherry-bomb">
                {totalAttempted > 0
                  ? `${Math.round((correctCount / totalAttempted) * 100)}% accuracy`
                  : "No words attempted"
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={startGame}
                size="lg"
                className="text-lg px-6 py-5 bg-white text-gray-800 hover:bg-gray-100 shadow-lg"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Play Again
              </Button>

              <Button 
                variant="outline"
                size="lg"
                asChild
                className="text-lg px-6 py-5 bg-white/50 hover:bg-white shadow-lg"
              >
                <Link href="/dashboard">
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
