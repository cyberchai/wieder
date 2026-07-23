"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, ProtectedRoute } from "@/providers/auth-provider";
import {
  getFlashcardSet,
  type FlashcardSet,
  type Card as CardType,
} from "@/services/flashcard-sets";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWindowSize } from "@/hooks/use-window-size";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import RainDrops from "@/components/rain-drops";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useTrackGamePlayed } from "@/hooks/use-stats-queries";

interface FallingWord {
  id: string;
  term: string;        // card.front
  definition: string;  // card.back
  y: number;
  x: number;
}

type MatchMode = "definition" | "term";

export default function PlayPage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = useIsMobile();
  const { handleCorrectAnswer, handleToggleOn, handleIncorrectAnswer, handleGameEnded, handleHeartLost, enableSounds } = useSoundEffects();
  const trackGamePlayed = useTrackGamePlayed();

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);

  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">(
    "idle"
  );
  const [shuffledCards, setShuffledCards] = useState<CardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [gameEndReason, setGameEndReason] = useState<"success" | "failure" | null>(null);

  const [fallingWord, setFallingWord] = useState<FallingWord | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const [typed, setTyped] = useState(""); // live typing shown on screen
  const [acceptGeneralAnswers, setAcceptGeneralAnswers] = useState(false);
  const [matchMode, setMatchMode] = useState<MatchMode>("definition"); // toggle term/definition
  const headerHeight = 72; // Header height estimate

  // prevents double life-loss for the same missed word
  const missedHandledRef = useRef(false);

  const safePaddingX = 20; // keep words fully visible left/right
  const fallSpeed = isMobile ? 0.625 : 1.25;  // half speed on mobile

  const fetchSet = useCallback(async () => {
    setLoading(true);
    const fetchedSet = await getFlashcardSet(setId);
    if (fetchedSet) {
              // Allow access if: user owns the set, set is shared, or set is public
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

  const shuffleCards = useCallback((cards: CardType[]) => {
    if (!cards?.length) return [];
    // let gameCards = [...cards];
    const gameCards = [...cards];
    const extras = [...cards]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * cards.length));
    gameCards.push(...extras);
    return gameCards.sort(() => Math.random() - 0.5);
  }, []);

  const spawnNewWord = useCallback((cards?: CardType[], startIndex?: number) => {
    missedHandledRef.current = false;

    const list = cards ?? shuffledCards;
    const idx = startIndex ?? currentCardIndex;

    if (idx >= list.length) {
      enableSounds(); // Enable sounds on first user interaction
      setGameState("gameover");
      setGameEndReason("success");
      setFallingWord(null);
      handleGameEnded(); // Play game ended sound
      
      // Track game completion (100 Wieds)
      if (user) {
        trackGamePlayed.mutate();
      }
      return;
    }

    const card = list[idx];

    const areaWidth = gameAreaRef.current?.offsetWidth ?? windowWidth ?? 800;
    const estimateWordWidth = Math.min(
      Math.max(wordRef.current?.offsetWidth ?? 180, 120),
      360
    );
    const maxX = Math.max(
      0,
      areaWidth - estimateWordWidth - safePaddingX * 2
    );
    const randomX = safePaddingX + Math.random() * maxX;

    setFallingWord({
      id: card.id,
      term: card.front,
      definition: card.back,
      y: 0,
      x: randomX,
    });

    // advance index relative to what we actually used
    setCurrentCardIndex(idx + 1);
  }, [currentCardIndex, shuffledCards, safePaddingX, windowWidth]);

  // Falling animation loop (full-width area, one-life-only on miss)
  useEffect(() => {
    if (gameState !== "playing" || !fallingWord) return;

    let raf = 0;
    const tick = () => {
      setFallingWord((prev) => {
        if (!prev) return null;

        const nextY = prev.y + fallSpeed;
        const areaHeight =
          gameAreaRef.current?.offsetHeight ?? (windowHeight ?? 700);
        const wordH = wordRef.current?.offsetHeight ?? 36;

        // If the bottom of the word passes the bottom edge
        if (nextY + wordH >= areaHeight && !missedHandledRef.current) {
          missedHandledRef.current = true; // guard: ensure only once

          setLives((l) => {
            const nl = Math.max(0, l - 1);
            enableSounds(); // Enable sounds on first user interaction
            handleHeartLost(); // Play heart lost sound
            if (nl <= 0) {
              setGameState("gameover");
              setGameEndReason("failure");
              handleGameEnded(); // Play game ended sound
            }
            return nl;
          });

          // Replace current word shortly after miss
          setTimeout(() => {
            if (gameState === "playing") spawnNewWord();
          }, 120);

          return null; // remove current word from screen
        }

        return { ...prev, y: nextY };
      });

      if (gameState === "playing") {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameState, fallingWord, fallSpeed, spawnNewWord, windowHeight]);

  // Smart text normalization for general answer acceptance
  const normalizeText = (s: string) => {
    if (!acceptGeneralAnswers) {
      return s.toLowerCase().trim();
    }
    // Remove extra spaces, normalize punctuation, and clean up
    return s
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .toLowerCase()
      .trim();
  };

    // Fast answer checking with multiple strategies
  const isAnswerCorrect = (userInput: string, correctAnswer: string): boolean => {
    if (!acceptGeneralAnswers) {
      return normalizeText(userInput) === normalizeText(correctAnswer);
    }

    const normalizedUser = normalizeText(userInput);
    const normalizedCorrect = normalizeText(correctAnswer);

    // Exact match after normalization
    if (normalizedUser === normalizedCorrect) return true;

    // Calculate similarity score using multiple metrics
    const similarityScore = calculateSimilarity(normalizedUser, normalizedCorrect);
    
    // Require 87% similarity for acceptance
    return similarityScore >= 0.87;
  };

  // Calculate similarity between user input and correct answer
  const calculateSimilarity = (userInput: string, correctAnswer: string): number => {
    if (userInput === correctAnswer) return 1.0;
    
    const userWords = userInput.split(' ').filter(word => word.length > 0);
    const correctWords = correctAnswer.split(' ').filter(word => word.length > 0);
    
    // Handle single word vs multi-word differently
    if (correctWords.length === 1) {
      // For single words, require very high similarity
      if (userInput.length < Math.max(3, correctAnswer.length * 0.6)) return 0;
      
      // Check if user input is a significant part of the correct answer
      if (correctAnswer.includes(userInput) && userInput.length >= correctAnswer.length * 0.7) {
        return userInput.length / correctAnswer.length;
      }
      
      // Check character-level similarity for single words
      return calculateCharacterSimilarity(userInput, correctAnswer);
    }
    
    // For multi-word answers, use word-level matching with higher thresholds
    if (userWords.length === 0) return 0;
    
    // Calculate word-level similarity
    let matchedWords = 0;
    let totalUserWordLength = 0;
    
    for (const userWord of userWords) {
      let bestMatch = 0;
      let bestMatchLength = 0;
      
      for (const correctWord of correctWords) {
        // Check if words are similar (allowing for minor variations)
        if (userWord === correctWord) {
          bestMatch = 1.0;
          bestMatchLength = userWord.length;
          break;
        }
        
        // Check for partial matches (but require significant overlap)
        if (userWord.length >= 3 && correctWord.length >= 3) {
          const charSimilarity = calculateCharacterSimilarity(userWord, correctWord);
          if (charSimilarity > 0.8 && userWord.length > bestMatchLength) {
            bestMatch = charSimilarity;
            bestMatchLength = userWord.length;
          }
        }
      }
      
      if (bestMatch > 0) {
        matchedWords += bestMatch;
        totalUserWordLength += bestMatchLength;
      }
    }
    
    // Calculate final similarity score
    const wordSimilarity = matchedWords / userWords.length;
    const lengthSimilarity = totalUserWordLength / Math.max(userInput.length, correctAnswer.length);
    
    // Weight word similarity more heavily for multi-word answers
    return (wordSimilarity * 0.7) + (lengthSimilarity * 0.3);
  };

  // Calculate character-level similarity between two strings
  const calculateCharacterSimilarity = (str1: string, str2: string): number => {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Use Levenshtein distance for character similarity
    const distance = levenshteinDistance(longer, shorter);
    return Math.max(0, (longer.length - distance) / longer.length);
  };

  // Calculate Levenshtein distance between two strings
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,      // deletion
          matrix[j - 1][i] + 1,      // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  const currentPrompt = useMemo(() => {
    if (!fallingWord) return "";
    return matchMode === "definition" ? fallingWord.definition : fallingWord.term;
  }, [fallingWord, matchMode]);

  const currentTarget = useMemo(() => {
    if (!fallingWord) return "";
    // What the user must type to score
    return matchMode === "definition" ? fallingWord.definition : fallingWord.term;
  }, [fallingWord, matchMode]);

  // Evaluate correctness as-you-type
  useEffect(() => {
    if (gameState !== "playing" || !fallingWord) return;
    
    if (typed.length > 0 && isAnswerCorrect(typed, currentTarget)) {
      enableSounds(); // Enable sounds on first user interaction
      setScore((s) => s + 10);
      setTyped("");
      toast({ title: "Correct!", className: "bg-green-100 dark:bg-green-900/50" });
      handleCorrectAnswer(); // Play correct answer sound
      spawnNewWord();
    }
  }, [
    typed,
    currentTarget,
    gameState,
    fallingWord,
    spawnNewWord,
    toast,
    handleCorrectAnswer,
    enableSounds,
  ]);

  // Global key listener to capture typing; Enter clears input if wrong (desktop only)
  useEffect(() => {
    if (gameState !== "playing" || isMobile) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // ignore modifier-only keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Enter") {
        // On Enter: if not correct yet, clear typed but keep listening
        if (typed !== "" && !isAnswerCorrect(typed, currentTarget)) {
          e.preventDefault();
          enableSounds(); // Enable sounds on first user interaction
          setTyped("");
          toast({
            title: "try again",
            description: "that wasn't it, keep trying!",
          });
          handleIncorrectAnswer(); // Play incorrect answer sound
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        setTyped((t) => t.slice(0, -1));
        return;
      }

      if (e.key.length === 1) {
        // Regular printable character
        setTyped((t) => (t + e.key).slice(0, 120)); // cap length
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameState, typed, currentTarget, toast, isMobile]);

  // Mobile input handling
  const handleMobileInputFocus = () => {
    enableSounds(); // Enable sounds immediately when input is focused
  };

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTyped(value.slice(0, 120)); // cap length
    enableSounds(); // Enable sounds on first user interaction
  };

  const handleMobileInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // On Enter: if not correct yet, clear input but keep listening
      if (typed !== "" && !isAnswerCorrect(typed, currentTarget)) {
        e.preventDefault();
        setTyped("");
        toast({
          title: "try again",
          description: "that wasn't it, keep trying!",
        });
        handleIncorrectAnswer(); // Play incorrect answer sound
      }
    }
  };



  const startGame = () => {
    const newCards = shuffleCards(set?.cards || []);

    setScore(0);
    setLives(3);
    setTyped("");
    setFallingWord(null);
    setShuffledCards(newCards);
    setCurrentCardIndex(0);
    setGameEndReason(null);

    // Enable sounds when starting the game (especially important for mobile)
    enableSounds();

    if (newCards.length > 0) {
      setGameState("playing");
      // use the local deck directly so we don't depend on async state
      spawnNewWord(newCards, 0);
    } else {
      setGameState("gameover");
      setGameEndReason("failure");
      handleGameEnded(); // Play game ended sound
    }
  };

  const restartGame = () => {
    setGameState("idle");
    setTyped("");
    setFallingWord(null);
    setGameEndReason(null);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-[100dvh] overflow-hidden bg-secondary/50">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <p className="opacity-70">loading…</p>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!set) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-[100dvh] overflow-hidden bg-secondary/50">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <p>loading set…</p>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
        <Header />

        {/* Main uses full screen width; the game area itself will be w-screen */}
        <main className="flex-1 min-h-0 px-0 flex flex-col">
          <div className="w-full mx-auto flex flex-col flex-1 min-h-0">

            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  back to dashboard
                </Link>
              </Button>

              <div className="flex items-center gap-4">
                {/* Toggle which side to type */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="mode-toggle" className="whitespace-nowrap">
                    flip to {matchMode === "definition" ? "definition" : "term"}
                  </Label>
                  <Switch
                    id="mode-toggle"
                    checked={matchMode === "term"}
                    onCheckedChange={(v) => setMatchMode(v ? "term" : "definition")}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="accept-general-answers"
                    checked={acceptGeneralAnswers}
                    onCheckedChange={setAcceptGeneralAnswers}
                  />
                  <Label htmlFor="accept-general-answers" className="cursor-pointer">
                    accept general answers
                  </Label>
                </div>
              </div>

              <div className="text-right">
                <h1 className="text-2xl font-bold leading-tight">{set.title}</h1>
                <p className="font-cherry-bomb text-muted-foreground -mt-1">falling words</p>
              </div>
            </div>

            {/* Game area (full-bleed, no border/outline) */}
            <div
              ref={gameAreaRef}
              className="relative overflow-hidden flex items-center justify-center w-screen flex-1 min-h-0"
            >
              {gameState === "idle" && (
                <div className="text-center flex flex-col items-center justify-center h-full w-full">
                  <h2 className="text-3xl font-bold font-cherry-bomb mb-4">lock in!</h2>
                  <p className="text-muted-foreground mb-6 px-4">
                    type the {matchMode}. the word falls, don&apos;t let it hit the bottom.
                    {acceptGeneralAnswers && " smart scoring accepts answers with 87%+ similarity."}
                  </p>
                  <Button onClick={startGame} size="lg">
                    start game
                  </Button>
                </div>
              )}

              {gameState === "gameover" && (
                <div className="text-center flex flex-col items-center justify-center h-full w-full">
                  <h2 className="text-3xl font-bold font-cherry-bomb mb-4">
                    {gameEndReason === "success" ? "congrats, game over!" : "womp womp game over!"}
                  </h2>
                  <p className="text-xl font-cherry-bomb text-muted-foreground mb-6">
                    <b>final score: {score}</b>
                    {/* {gameEndReason === "success" && ` - you completed the set with ${lives} ${lives === 1 ? 'life' : 'lives'} remaining! 🏆`} */}
                  </p>
                  <Button onClick={startGame} size="lg">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    play again
                  </Button>
                </div>
              )}

              {gameState === "playing" && (
                <>
                  {/* HUD */}
                  <div className="w-full flex justify-between items-center absolute top-4 px-6">
                    <p className="text-lg font-bold font-cherry-bomb">score: {score}</p>
                    <p className="text-lg font-bold font-cherry-bomb">
                      lives: {"❤️".repeat(Math.max(0, lives))}
                    </p>
                  </div>

                  {/* Rain drops animation */}
                  <RainDrops 
                    score={score} 
                    isPlaying={gameState === "playing"} 
                    headerHeight={headerHeight}
                  />

                  {/* Falling prompt (always show the *other* side on the tile) */}
                  {fallingWord && (
                    <div
                      ref={wordRef}
                      className="absolute bg-card text-card-foreground py-2 px-4 rounded-md shadow-lg"
                      style={{ top: `${fallingWord.y}px`, left: `${fallingWord.x}px` }}
                    >
                      <p className="text-xl font-semibold">
                        {matchMode === "definition" ? fallingWord.term : fallingWord.definition}
                      </p>
                    </div>
                  )}

                  {/* Live typing display (desktop) or mobile input */}
                  {isMobile ? (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-12 w-full max-w-sm px-6">
                      <Input
                        ref={mobileInputRef}
                        value={typed}
                        onChange={handleMobileInputChange}
                        onKeyDown={handleMobileInputKeyDown}
                        onFocus={handleMobileInputFocus}
                        placeholder="Type your answer..."
                        className="text-lg h-12 text-center"
                        autoFocus
                      />
                      <div className="text-sm opacity-60 mt-2 text-center">
                        press <kbd className="px-2 py-1 rounded border">Enter</kbd> to clear if wrong
                        {acceptGeneralAnswers && typed.length > 0 && (
                          <div className="mt-1 text-xs opacity-50">
                            similarity: {Math.round(calculateSimilarity(normalizeText(typed), currentTarget) * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2 bottom-12 text-center px-6">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide">
                        {typed || <span className="opacity-40">start typing…</span>}
                      </div>
                      <div className="text-sm opacity-60 mt-2">
                        press <kbd className="px-2 py-1 rounded border">Enter</kbd> to clear if wrong
                        {acceptGeneralAnswers && typed.length > 0 && (
                          <div className="mt-1 text-xs opacity-50">
                            similarity: {Math.round(calculateSimilarity(normalizeText(typed), currentTarget) * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
