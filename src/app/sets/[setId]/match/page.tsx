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
import { ArrowLeft, RefreshCw, Home, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useTrackGamePlayed } from "@/hooks/use-stats-queries";

// ===========================================
// TYPES
// ===========================================

interface MatchCard {
  id: string;
  content: string;
  pairId: string;
  type: "term" | "definition";
  isMatched: boolean;
  isSelected: boolean;
  isShaking: boolean;
}

type GameState = "idle" | "playing" | "complete";

// ===========================================
// COMPONENT
// ===========================================

export default function MatchPairsPage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleCorrectAnswer, handleIncorrectAnswer, handleGameEnded, enableSounds } = useSoundEffects();
  const trackGamePlayed = useTrackGamePlayed();

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_PAIRS = 8;

  // Load best time from localStorage
  useEffect(() => {
    if (setId) {
      const stored = localStorage.getItem(`matchPairs_${setId}_bestTime`);
      if (stored) {
        setBestTime(parseInt(stored, 10));
      }
    }
  }, [setId]);

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

  // Prepare game cards
  const prepareGameCards = useCallback((flashcards: CardType[]): MatchCard[] => {
    if (!flashcards?.length) return [];

    // Shuffle and take up to MAX_PAIRS
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, MAX_PAIRS);

    // Create term and definition cards
    const gameCards: MatchCard[] = [];
    
    selected.forEach((card, index) => {
      const pairId = `pair-${index}`;
      
      // Term card
      gameCards.push({
        id: `term-${index}`,
        content: card.front,
        pairId,
        type: "term",
        isMatched: false,
        isSelected: false,
        isShaking: false,
      });
      
      // Definition card
      gameCards.push({
        id: `def-${index}`,
        content: card.back,
        pairId,
        type: "definition",
        isMatched: false,
        isSelected: false,
        isShaking: false,
      });
    });

    // Shuffle all cards for the grid
    return gameCards.sort(() => Math.random() - 0.5);
  }, []);

  // Start timer
  const startTimer = useCallback(() => {
    setElapsedTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start game
  const startGame = useCallback(() => {
    if (!set?.cards?.length) return;

    const gameCards = prepareGameCards(set.cards);
    if (gameCards.length === 0) return;

    setCards(gameCards);
    setSelectedCards([]);
    setIsChecking(false);
    enableSounds();
    setGameState("playing");
    startTimer();
  }, [set, prepareGameCards, enableSounds, startTimer]);

  // Handle card click
  const handleCardClick = useCallback((cardId: string) => {
    if (isChecking) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched || card.isSelected) return;

    // Select the card
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isSelected: true } : c
    ));

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    // Check for match if two cards selected
    if (newSelected.length === 2) {
      setIsChecking(true);
      
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard) {
        // Check if they're a matching pair (same pairId, different types)
        const isMatch = firstCard.pairId === secondCard.pairId && 
                        firstCard.type !== secondCard.type;

        if (isMatch) {
          // Match found!
          enableSounds();
          handleCorrectAnswer();
          
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true, isSelected: false }
              : c
          ));
          setSelectedCards([]);
          setIsChecking(false);

          // Check for game completion
          const matchedCount = cards.filter(c => c.isMatched).length + 2;
          if (matchedCount === cards.length) {
            // All matched!
            stopTimer();
            handleGameEnded();
            setGameState("complete");

            // Save best time
            const finalTime = elapsedTime;
            if (bestTime === null || finalTime < bestTime) {
              localStorage.setItem(`matchPairs_${setId}_bestTime`, finalTime.toString());
              setBestTime(finalTime);
            }

            if (user) {
              trackGamePlayed.mutate();
            }
          }
        } else {
          // No match - shake and reset
          enableSounds();
          handleIncorrectAnswer();
          
          // Add shake animation
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId
              ? { ...c, isShaking: true }
              : c
          ));

          // Reset after animation
          setTimeout(() => {
            setCards(prev => prev.map(c => 
              c.id === firstId || c.id === secondId
                ? { ...c, isSelected: false, isShaking: false }
                : c
            ));
            setSelectedCards([]);
            setIsChecking(false);
          }, 600);
        }
      }
    }
  }, [cards, selectedCards, isChecking, enableSounds, handleCorrectAnswer, handleIncorrectAnswer, handleGameEnded, stopTimer, elapsedTime, bestTime, setId, user, trackGamePlayed]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-emerald-950">
          <p className="text-xl text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!set) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-emerald-950">
          <p className="text-xl text-gray-700 dark:text-gray-300">Set not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-emerald-950">
        
        {/* Idle State - Start Screen */}
        {gameState === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {set.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Match Pairs
            </p>

            <p className="text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">
              Match each term with its definition. Select two cards at a time.
            </p>

            {bestTime !== null && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-8">
                Best time: {formatTime(bestTime)}
              </p>
            )}

            <Button
              onClick={startGame}
              size="lg"
              className="text-xl px-8 py-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
            >
              Start Game
            </Button>

            <Button variant="ghost" asChild className="mt-6 text-gray-600 dark:text-gray-400">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        )}

        {/* Playing State */}
        {gameState === "playing" && (
          <div className="flex-1 flex flex-col">
            {/* Header with timer */}
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur border-b">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>

              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                <Clock className="w-5 h-5" />
                <span>{formatTime(elapsedTime)}</span>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {cards.filter(c => c.isMatched).length / 2} / {cards.length / 2} pairs
              </div>
            </div>

            {/* Game Grid */}
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="grid grid-cols-4 gap-4 max-w-4xl w-full">
                {cards.map((card) => {
                  const isClickable = !card.isMatched && !card.isSelected && !isChecking;
                  return (
                    <div
                      key={card.id}
                      onClick={() => isClickable && handleCardClick(card.id)}
                      role="button"
                      tabIndex={isClickable ? 0 : -1}
                      onKeyDown={(e) => {
                        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleCardClick(card.id);
                        }
                      }}
                      className={`
                        relative min-h-[120px] sm:min-h-[140px] p-4 rounded-2xl shadow-md
                        flex items-center justify-center text-center select-none
                        transition-all duration-200 ease-out
                        ${card.isMatched 
                          ? 'cursor-default scale-95' 
                          : card.isSelected
                            ? card.isShaking
                              ? 'animate-shake'
                              : 'ring-4 ring-blue-200'
                            : 'hover:scale-105 cursor-pointer border border-stone-300 active:scale-95'
                        }
                      `}
                      style={{
                        backgroundColor: card.isMatched 
                          ? '#4ade80'
                          : card.isSelected 
                            ? card.isShaking
                              ? '#f87171'
                              : '#60a5fa'
                            : '#FFFDF7'
                      }}
                    >
                      <span
                        className="text-base sm:text-lg md:text-xl font-semibold leading-snug"
                        style={{
                          color: card.isMatched || card.isSelected ? '#ffffff' : '#1f2937'
                        }}
                      >
                        {card.content}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Complete State */}
        {gameState === "complete" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Well Done!
            </h2>

            <div className="text-center mb-8">
              <p className="text-6xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                {formatTime(elapsedTime)}
              </p>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {bestTime === elapsedTime ? "New best time!" : `Best: ${formatTime(bestTime!)}`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={startGame}
                size="lg"
                className="text-lg px-6 py-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
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

        {/* CSS for shake animation */}
        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
