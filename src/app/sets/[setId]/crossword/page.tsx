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
import { ArrowLeft, RefreshCw, Home, Check, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useTrackGamePlayed } from "@/hooks/use-stats-queries";

// ===========================================
// TYPES
// ===========================================

interface WordObj {
  string: string;
  clue: string;
  char: string[];
  totalMatches: number;
  effectiveMatches: number;
  successfulMatches: CrossMatch[];
  x: number;
  y: number;
  dir: number; // 0 = across, 1 = down
  number?: number;
}

interface CrossMatch {
  x: number;
  y: number;
  dir: number;
}

interface CharRef {
  wordIndex: number;
  prev: CharRef | null;
  next: CharRef | null;
  value: string;
  index: number;
}

interface BoardCell {
  value: string | null;
  char: CharRef[];
}

interface Bounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ClueItem {
  number: number;
  clue: string;
  word: string;
}

type GameState = "loading" | "error" | "idle" | "playing" | "complete";

// ===========================================
// CROSSWORD GENERATION ALGORITHM
// ===========================================

function cleanVars(): { board: BoardCell[][]; bounds: Bounds } {
  const board: BoardCell[][] = [];
  for (let i = 0; i < 50; i++) {
    board.push([]);
    for (let j = 0; j < 50; j++) {
      board[i].push({ value: null, char: [] });
    }
  }
  return {
    board,
    bounds: { top: 999, right: 0, bottom: 0, left: 999 },
  };
}

function updateBounds(bounds: Bounds, x: number, y: number): void {
  bounds.top = Math.min(y, bounds.top);
  bounds.right = Math.max(x, bounds.right);
  bounds.bottom = Math.max(y, bounds.bottom);
  bounds.left = Math.min(x, bounds.left);
}

function prepareWordBank(words: { term: string; clue: string }[]): WordObj[] {
  const wordBank: WordObj[] = words.map((w) => ({
    string: w.term.toUpperCase(),
    clue: w.clue,
    char: w.term.toUpperCase().split(""),
    totalMatches: 0,
    effectiveMatches: 0,
    successfulMatches: [],
    x: 0,
    y: 0,
    dir: 0,
  }));

  // Calculate total matches (potential intersections)
  for (let i = 0; i < wordBank.length; i++) {
    for (let j = 0; j < wordBank[i].char.length; j++) {
      const cA = wordBank[i].char[j];
      for (let k = 0; k < wordBank.length; k++) {
        if (k !== i) {
          for (let l = 0; l < wordBank[k].char.length; l++) {
            if (cA === wordBank[k].char[l]) {
              wordBank[i].totalMatches++;
            }
          }
        }
      }
    }
  }

  return wordBank;
}

function addWordToBoard(
  wordBank: WordObj[],
  wordsActive: WordObj[],
  board: BoardCell[][],
  bounds: Bounds
): boolean {
  let curIndex: number;

  if (wordsActive.length < 1) {
    // First word - find the one with fewest potential matches
    curIndex = 0;
    for (let i = 0; i < wordBank.length; i++) {
      if (wordBank[i].totalMatches < wordBank[curIndex].totalMatches) {
        curIndex = i;
      }
    }
    wordBank[curIndex].successfulMatches = [{ x: 12, y: 12, dir: 0 }];
  } else {
    // Find intersections with existing words
    curIndex = -1;
    let minMatchDiff = 9999;

    for (let i = 0; i < wordBank.length; i++) {
      const curWord = wordBank[i];
      curWord.effectiveMatches = 0;
      curWord.successfulMatches = [];

      for (let j = 0; j < curWord.char.length; j++) {
        const curChar = curWord.char[j];

        for (let k = 0; k < wordsActive.length; k++) {
          const testWord = wordsActive[k];

          for (let l = 0; l < testWord.char.length; l++) {
            const testChar = testWord.char[l];

            if (curChar === testChar) {
              curWord.effectiveMatches++;

              const curCross: CrossMatch = { x: testWord.x, y: testWord.y, dir: 0 };

              if (testWord.dir === 0) {
                curCross.dir = 1;
                curCross.x += l;
                curCross.y -= j;
              } else {
                curCross.dir = 0;
                curCross.y += l;
                curCross.x -= j;
              }

              // Validate placement
              let isMatch = true;

              for (let m = -1; m < curWord.char.length + 1 && isMatch; m++) {
                if (m !== j) {
                  const crossVal: (string | null)[] = [];

                  if (curCross.dir === 0) {
                    const xIndex = curCross.x + m;
                    if (xIndex < 0 || xIndex >= board.length) {
                      isMatch = false;
                      break;
                    }
                    crossVal.push(board[xIndex][curCross.y]?.value ?? null);
                    crossVal.push(board[xIndex][curCross.y + 1]?.value ?? null);
                    crossVal.push(board[xIndex][curCross.y - 1]?.value ?? null);
                  } else {
                    const yIndex = curCross.y + m;
                    if (yIndex < 0 || yIndex >= board[curCross.x]?.length) {
                      isMatch = false;
                      break;
                    }
                    crossVal.push(board[curCross.x][yIndex]?.value ?? null);
                    crossVal.push(board[curCross.x + 1]?.[yIndex]?.value ?? null);
                    crossVal.push(board[curCross.x - 1]?.[yIndex]?.value ?? null);
                  }

                  if (m > -1 && m < curWord.char.length) {
                    if (crossVal[0] !== curWord.char[m]) {
                      if (crossVal[0] !== null) {
                        isMatch = false;
                      } else if (crossVal[1] !== null) {
                        isMatch = false;
                      } else if (crossVal[2] !== null) {
                        isMatch = false;
                      }
                    }
                  } else if (crossVal[0] !== null) {
                    isMatch = false;
                  }
                }
              }

              if (isMatch) {
                curWord.successfulMatches.push(curCross);
              }
            }
          }
        }
      }

      const curMatchDiff = curWord.totalMatches - curWord.effectiveMatches;

      if (curMatchDiff < minMatchDiff && curWord.successfulMatches.length > 0) {
        minMatchDiff = curMatchDiff;
        curIndex = i;
      } else if (curMatchDiff <= 0) {
        return false;
      }
    }
  }

  if (curIndex === -1) {
    return false;
  }

  // Move word from bank to active
  const [word] = wordBank.splice(curIndex, 1);
  wordsActive.push(word);

  const pushIndex = wordsActive.length - 1;
  const matchArr = wordsActive[pushIndex].successfulMatches;
  const matchIndex = Math.floor(Math.random() * matchArr.length);
  const matchData = matchArr[matchIndex];

  wordsActive[pushIndex].x = matchData.x;
  wordsActive[pushIndex].y = matchData.y;
  wordsActive[pushIndex].dir = matchData.dir;

  // Place characters on board
  let prevObj: CharRef | null = null;

  for (let i = 0; i < wordsActive[pushIndex].char.length; i++) {
    let xInd = matchData.x;
    let yInd = matchData.y;

    if (matchData.dir === 0) {
      xInd = matchData.x + i;
    } else {
      yInd = matchData.y + i;
    }

    const cObj: CharRef = {
      wordIndex: pushIndex,
      prev: prevObj,
      value: wordsActive[pushIndex].char[i],
      next: null,
      index: 0,
    };

    const cIndex = board[xInd][yInd].char.length;
    cObj.index = cIndex;

    board[xInd][yInd].char.push(cObj);
    board[xInd][yInd].value = wordsActive[pushIndex].char[i];

    updateBounds(bounds, xInd, yInd);

    if (prevObj !== null) {
      prevObj.next = board[xInd][yInd].char[cIndex];
    }

    prevObj = board[xInd][yInd].char[cIndex];
  }

  return true;
}

function generateCrossword(words: { term: string; clue: string }[]): {
  success: boolean;
  board: BoardCell[][];
  bounds: Bounds;
  wordsActive: WordObj[];
} | null {
  // Try up to 19 times to generate a valid crossword
  for (let attempt = 0; attempt < 19; attempt++) {
    const { board, bounds } = cleanVars();
    const wordBank = prepareWordBank(words);
    const wordsActive: WordObj[] = [];

    let isSuccess = true;
    const wordCount = wordBank.length;

    for (let i = 0; i < wordCount && isSuccess; i++) {
      isSuccess = addWordToBoard(wordBank, wordsActive, board, bounds);
    }

    if (isSuccess && wordsActive.length === words.length) {
      return { success: true, board, bounds, wordsActive };
    }
  }

  return null;
}

function assignClueNumbers(
  board: BoardCell[][],
  bounds: Bounds,
  wordsActive: WordObj[]
): { acrossClues: ClueItem[]; downClues: ClueItem[] } {
  const acrossClues: ClueItem[] = [];
  const downClues: ClueItem[] = [];
  let clueNumber = 1;
  const assignedStarts = new Set<string>();

  // Scan board top-to-bottom, left-to-right to assign numbers
  for (let y = bounds.top; y <= bounds.bottom; y++) {
    for (let x = bounds.left; x <= bounds.right; x++) {
      const cell = board[x]?.[y];
      if (!cell || cell.value === null) continue;

      for (const charRef of cell.char) {
        if (charRef.prev === null) {
          // This is the start of a word
          const word = wordsActive[charRef.wordIndex];
          const key = `${word.x}-${word.y}-${word.dir}`;

          if (!assignedStarts.has(key)) {
            assignedStarts.add(key);
            word.number = clueNumber;

            const clueItem: ClueItem = {
              number: clueNumber,
              clue: word.clue,
              word: word.string,
            };

            if (word.dir === 0) {
              acrossClues.push(clueItem);
            } else {
              downClues.push(clueItem);
            }

            clueNumber++;
          }
        }
      }
    }
  }

  // Sort clues by number
  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return { acrossClues, downClues };
}

// ===========================================
// COMPONENT
// ===========================================

export default function CrosswordPage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleCorrectAnswer, handleGameEnded, enableSounds } = useSoundEffects();
  const trackGamePlayed = useTrackGamePlayed();

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Crossword state
  const [board, setBoard] = useState<BoardCell[][] | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [wordsActive, setWordsActive] = useState<WordObj[]>([]);
  const [acrossClues, setAcrossClues] = useState<ClueItem[]>([]);
  const [downClues, setDownClues] = useState<ClueItem[]>([]);

  // User input state - map of "x-y" to user's letter
  const [userInputs, setUserInputs] = useState<Map<string, string>>(new Map());
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [currentDirection, setCurrentDirection] = useState<number>(0); // 0 = across, 1 = down

  // Results
  const [showResults, setShowResults] = useState(false);
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [incorrectCells, setIncorrectCells] = useState<Set<string>>(new Set());

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const MAX_TERMS = 8;
  const MAX_TERM_LENGTH = 15;

  // Fetch the flashcard set
  const fetchSet = useCallback(async () => {
    setGameState("loading");
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
      setGameState("idle");
    } else {
      toast({
        title: "Error",
        description: "Set not found.",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [router, setId, toast, user?.uid]);

  useEffect(() => {
    if (setId && user) fetchSet();
  }, [setId, user, fetchSet]);

  // Filter valid terms for crossword
  const getValidTerms = useCallback((cards: CardType[]): { term: string; clue: string }[] => {
    const validTerms = cards
      .map((card) => ({
        term: card.front.replace(/[^a-zA-Z]/g, ""), // Remove non-alpha characters
        clue: card.back,
        originalTerm: card.front,
      }))
      .filter((item) => item.term.length > 1 && item.term.length <= MAX_TERM_LENGTH);

    // Shuffle and take up to MAX_TERMS
    const shuffled = [...validTerms].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, MAX_TERMS);
  }, []);

  // Generate crossword
  const generateGame = useCallback(() => {
    if (!set?.cards?.length) {
      setErrorMessage("No cards in this set.");
      setGameState("error");
      return;
    }

    const validTerms = getValidTerms(set.cards);

    if (validTerms.length === 0) {
      setErrorMessage(
        "I'm sorry! I couldn't create a crossword puzzle with this set! Try a different game?"
      );
      setGameState("error");
      return;
    }

    const result = generateCrossword(validTerms);

    if (!result || !result.success) {
      setErrorMessage(
        "I'm sorry! I couldn't create a crossword puzzle with this set! Try a different game?"
      );
      setGameState("error");
      return;
    }

    const { acrossClues, downClues } = assignClueNumbers(
      result.board,
      result.bounds,
      result.wordsActive
    );

    setBoard(result.board);
    setBounds(result.bounds);
    setWordsActive(result.wordsActive);
    setAcrossClues(acrossClues);
    setDownClues(downClues);
    setUserInputs(new Map());
    setFocusedCell(null);
    setCurrentDirection(0);
    setShowResults(false);
    setCorrectCells(new Set());
    setIncorrectCells(new Set());
    setGameState("playing");
    enableSounds();
  }, [set, getValidTerms, enableSounds]);

  // Handle cell input
  const handleCellInput = (x: number, y: number, value: string) => {
    const key = `${x}-${y}`;
    const newInputs = new Map(userInputs);

    if (value.length === 0) {
      newInputs.delete(key);
    } else {
      newInputs.set(key, value.toUpperCase().slice(-1));
    }

    setUserInputs(newInputs);

    // Auto-advance to next cell
    if (value.length > 0) {
      advanceToNextCell(x, y);
    }
  };

  // Advance to next cell in current direction
  const advanceToNextCell = (x: number, y: number) => {
    if (!board || !bounds) return;

    let nextX = x;
    let nextY = y;

    if (currentDirection === 0) {
      // Across
      nextX = x + 1;
    } else {
      // Down
      nextY = y + 1;
    }

    // Check if next cell is valid
    if (
      nextX >= bounds.left &&
      nextX <= bounds.right &&
      nextY >= bounds.top &&
      nextY <= bounds.bottom &&
      board[nextX]?.[nextY]?.value !== null
    ) {
      const key = `${nextX}-${nextY}`;
      setFocusedCell(key);
      inputRefs.current.get(key)?.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, x: number, y: number) => {
    if (!board || !bounds) return;

    let nextX = x;
    let nextY = y;

    switch (e.key) {
      case "ArrowLeft":
        nextX = x - 1;
        break;
      case "ArrowRight":
        nextX = x + 1;
        break;
      case "ArrowUp":
        nextY = y - 1;
        break;
      case "ArrowDown":
        nextY = y + 1;
        break;
      case "Backspace":
        if (!userInputs.has(`${x}-${y}`)) {
          // Move back if cell is empty
          if (currentDirection === 0) {
            nextX = x - 1;
          } else {
            nextY = y - 1;
          }
        }
        break;
      case "Tab":
        // Toggle direction
        e.preventDefault();
        setCurrentDirection((d) => (d === 0 ? 1 : 0));
        return;
      default:
        return;
    }

    // Validate next cell
    if (
      nextX >= bounds.left &&
      nextX <= bounds.right &&
      nextY >= bounds.top &&
      nextY <= bounds.bottom &&
      board[nextX]?.[nextY]?.value !== null
    ) {
      const key = `${nextX}-${nextY}`;
      setFocusedCell(key);
      inputRefs.current.get(key)?.focus();
    }
  };

  // Check answers
  const checkAnswers = () => {
    if (!board || !bounds) return;

    const correct = new Set<string>();
    const incorrect = new Set<string>();
    let allCorrect = true;

    for (let y = bounds.top; y <= bounds.bottom; y++) {
      for (let x = bounds.left; x <= bounds.right; x++) {
        const cell = board[x]?.[y];
        if (cell && cell.value !== null) {
          const key = `${x}-${y}`;
          const userInput = userInputs.get(key);

          if (userInput === cell.value) {
            correct.add(key);
          } else {
            incorrect.add(key);
            allCorrect = false;
          }
        }
      }
    }

    setCorrectCells(correct);
    setIncorrectCells(incorrect);
    setShowResults(true);

    if (allCorrect) {
      handleCorrectAnswer();
      handleGameEnded();
      setGameState("complete");

      if (user) {
        trackGamePlayed.mutate();
      }
    }
  };

  // Reset game
  const resetGame = () => {
    setUserInputs(new Map());
    setShowResults(false);
    setCorrectCells(new Set());
    setIncorrectCells(new Set());
    setFocusedCell(null);
  };

  // Get cell number (for display)
  const getCellNumber = (x: number, y: number): number | null => {
    if (!board) return null;
    const cell = board[x]?.[y];
    if (!cell || cell.value === null) return null;

    for (const charRef of cell.char) {
      if (charRef.prev === null) {
        const word = wordsActive[charRef.wordIndex];
        return word.number ?? null;
      }
    }
    return null;
  };

  // Render loading state
  if (gameState === "loading") {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950">
          <p className="text-xl text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </ProtectedRoute>
    );
  }

  // Render error state
  if (gameState === "error") {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950 p-6">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Oops!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              {errorMessage}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Render idle state (start screen)
  if (gameState === "idle" && set) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950 p-6">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            {set.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Crossword Puzzle
          </p>

          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
            Solve the crossword puzzle using definitions as clues.
            <br />
            <span className="text-sm">(Uses up to 8 terms under 15 characters)</span>
          </p>

          <Button onClick={generateGame} size="lg" className="text-xl px-8 py-6">
            Start Game
          </Button>

          <Button variant="ghost" asChild className="mt-6 text-gray-600 dark:text-gray-400">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  // Render playing/complete state
  if ((gameState === "playing" || gameState === "complete") && board && bounds) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white/50 dark:bg-gray-800/50 backdrop-blur">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {set?.title} - Crossword
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetGame}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              {gameState !== "complete" && (
                <Button size="sm" onClick={checkAnswers}>
                  <Check className="mr-2 h-4 w-4" />
                  Check
                </Button>
              )}
            </div>
          </div>

          {/* Complete banner */}
          {gameState === "complete" && (
            <div className="bg-green-500 text-white p-4 text-center">
              <p className="text-xl font-bold">Congratulations! You solved the crossword!</p>
              <div className="flex justify-center gap-4 mt-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setGameState("idle");
                    generateGame();
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Puzzle
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col lg:flex-row p-4 gap-6 overflow-auto">
            {/* Crossword Grid */}
            <div className="flex-shrink-0 flex justify-center">
              <div
                className="inline-block bg-gray-800 dark:bg-gray-900 p-1 rounded shadow-lg"
                style={{ lineHeight: 0 }}
              >
                {Array.from({ length: bounds.bottom - bounds.top + 3 }, (_, rowIdx) => {
                  const y = bounds.top - 1 + rowIdx;
                  return (
                    <div key={y} className="flex">
                      {Array.from({ length: bounds.right - bounds.left + 3 }, (_, colIdx) => {
                        const x = bounds.left - 1 + colIdx;
                        const cell = board[x]?.[y];
                        const isActive = cell && cell.value !== null;
                        const key = `${x}-${y}`;
                        const cellNumber = isActive ? getCellNumber(x, y) : null;
                        const userValue = userInputs.get(key) || "";
                        const isCorrect = correctCells.has(key);
                        const isIncorrect = incorrectCells.has(key);

                        return (
                          <div
                            key={key}
                            className={`relative w-8 h-8 sm:w-10 sm:h-10 m-[1px] ${
                              isActive
                                ? showResults
                                  ? isCorrect
                                    ? "bg-green-200 dark:bg-green-800"
                                    : isIncorrect
                                    ? "bg-red-200 dark:bg-red-800"
                                    : "bg-white dark:bg-gray-200"
                                  : "bg-white dark:bg-gray-200"
                                : "bg-transparent"
                            }`}
                          >
                            {isActive && (
                              <>
                                {cellNumber && (
                                  <span className="absolute top-0 left-0.5 text-[8px] sm:text-[10px] text-gray-600 dark:text-gray-800 font-medium leading-none">
                                    {cellNumber}
                                  </span>
                                )}
                                <input
                                  ref={(el) => {
                                    if (el) inputRefs.current.set(key, el);
                                  }}
                                  type="text"
                                  maxLength={1}
                                  value={userValue}
                                  onChange={(e) => handleCellInput(x, y, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, x, y)}
                                  onFocus={() => {
                                    setFocusedCell(key);
                                    // Detect direction from clicked cell
                                    if (cell) {
                                      const hasAcross = cell.char.some(
                                        (c) => wordsActive[c.wordIndex]?.dir === 0
                                      );
                                      const hasDown = cell.char.some(
                                        (c) => wordsActive[c.wordIndex]?.dir === 1
                                      );
                                      if (hasAcross && !hasDown) setCurrentDirection(0);
                                      else if (hasDown && !hasAcross) setCurrentDirection(1);
                                    }
                                  }}
                                  disabled={gameState === "complete"}
                                  className={`w-full h-full text-center text-lg sm:text-xl font-bold uppercase bg-transparent border-0 outline-none text-gray-800 dark:text-gray-900 ${
                                    focusedCell === key
                                      ? "ring-2 ring-inset ring-indigo-500"
                                      : ""
                                  }`}
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clues */}
            <div className="flex-1 flex flex-col sm:flex-row gap-6 min-w-0">
              {/* Across Clues */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">
                  ACROSS
                </h3>
                <div className="space-y-2">
                  {acrossClues.map((clue) => (
                    <div key={`across-${clue.number}`} className="text-sm">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                        {clue.number}.
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{clue.clue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Down Clues */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">
                  DOWN
                </h3>
                <div className="space-y-2">
                  {downClues.map((clue) => (
                    <div key={`down-${clue.number}`} className="text-sm">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                        {clue.number}.
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{clue.clue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Direction indicator */}
          <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-white/30 dark:bg-gray-800/30">
            Direction: <span className="font-semibold">{currentDirection === 0 ? "Across →" : "Down ↓"}</span>
            <span className="ml-2 text-xs">(Press Tab to toggle)</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return null;
}
