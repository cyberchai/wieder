"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { getFlashcardSet, type FlashcardSet, type Card as CardType } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Shuffle, Repeat, Play, Pause } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function PracticePage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [shuffledCards, setShuffledCards] = useState<CardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'try-again' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [lenientMode, setLenientMode] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [multipleChoiceMode, setMultipleChoiceMode] = useState(false);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [autoplayTimer, setAutoplayTimer] = useState<NodeJS.Timeout | null>(null);

  const shuffleCards = useCallback((cards: CardType[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
  }, []);

  const generateMultipleChoiceOptions = useCallback((correctAnswer: string, allCards: CardType[], isReversed: boolean) => {
    const correctText = isReversed ? correctAnswer : correctAnswer;
    const otherOptions = allCards
      .filter(card => {
        const cardText = isReversed ? card.front : card.back;
        return cardText !== correctText;
      })
      .map(card => isReversed ? card.front : card.back)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const allOptions = [correctText, ...otherOptions];
    return allOptions.sort(() => Math.random() - 0.5);
  }, []);

  useEffect(() => {
    const fetchSet = async () => {
      setLoading(true);
      const fetchedSet = await getFlashcardSet(setId);
      if (fetchedSet) {
        if (!fetchedSet.shared && fetchedSet.userId !== user?.uid) {
            router.push('/dashboard');
        }
        setSet(fetchedSet);
        setShuffledCards(shuffleCards(fetchedSet.cards));
      } else {
        router.push('/dashboard');
      }
      setLoading(false);
    };

    if (setId && user) {
      fetchSet();
    }
  }, [setId, router, shuffleCards, user]);

  const currentCard = useMemo(() => shuffledCards[currentIndex], [shuffledCards, currentIndex]);

  const promptText = isReversed ? currentCard?.back : currentCard?.front;
  const answerText = isReversed ? currentCard?.front : currentCard?.back;

  // Generate multiple choice options when card changes
  useEffect(() => {
    if (multipleChoiceMode && currentCard && set) {
      const options = generateMultipleChoiceOptions(answerText, set.cards, isReversed);
      setMultipleChoiceOptions(options);
      setSelectedOption(null);
      setAttempts(0);
    }
  }, [currentIndex, multipleChoiceMode, currentCard, set, isReversed, answerText, generateMultipleChoiceOptions]);

  // Auto-focus input when card changes or feedback is cleared
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current && !feedback && !multipleChoiceMode) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, feedback, multipleChoiceMode]);

  // Keep input focused even after feedback is shown so user can press Enter to continue
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current && feedback && !multipleChoiceMode) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [feedback, multipleChoiceMode]);

  // Initial focus when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current && !loading && !feedback && !multipleChoiceMode) {
        inputRef.current.focus();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [loading, multipleChoiceMode]);

  // Autoplay timer effect
  useEffect(() => {
    if (autoplay && feedback) {
      const timer = setTimeout(() => {
        handleNextCard();
      }, 2000);
      setAutoplayTimer(timer);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [autoplay, feedback === 'correct' || feedback === 'try-again']);

  // Cleanup autoplay timer
  useEffect(() => {
    return () => {
      if (autoplayTimer) {
        clearTimeout(autoplayTimer);
      }
    };
  }, [autoplayTimer]);

  const cleanString = (str: string) => {
    if (!lenientMode) return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // Remove common articles and non-alphanumeric characters
    return str
      .toLowerCase()
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by|der|die|das|da|den|ein|eine|einer|eines|-n|von|der|-der|-die|-das|-da|-den|-ein|-eine|-einer|-eines)\b/g, '') // Remove common articles
      .replace(/[^a-zA-Z0-9]/g, '') // Remove remaining non-alphanumeric characters
      .replace(/\s+/g, '') // Remove extra spaces
      .trim();
  };
  
  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || feedback) return;
    
    const userAnswerClean = lenientMode ? cleanString(userAnswer) : userAnswer.trim().toLowerCase();
    const answerTextClean = lenientMode ? cleanString(answerText) : answerText.trim().toLowerCase();

    if (userAnswerClean === answerTextClean) {
      setFeedback('correct');
    } else {
      setFeedback('try-again');
      setShuffledCards(prev => [...prev, currentCard]);
    }
  };

  const handleMultipleChoiceSelect = (selectedAnswer: string) => {
    if (feedback || !currentCard) return;
    
    setSelectedOption(selectedAnswer);
    
    if (selectedAnswer === answerText) {
      setFeedback('correct');
      setAttempts(0);
    } else {
      setAttempts(prev => prev + 1);
      // Move the card to the end of the practice list for retry later
      setShuffledCards(prev => [...prev, currentCard]);
    }
  };

  const handleNextCard = () => {
    // Check if we've reached the end of the current practice session
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setFeedback(null);
      setSelectedOption(null);
      setAttempts(0);
    } else {
      // Check if there are any cards that were moved to the end for retry
      const originalCardCount = set?.cards.length || 0;
      if (shuffledCards.length > originalCardCount) {
        // There are retry cards, continue practicing
        setCurrentIndex(currentIndex + 1);
        setUserAnswer('');
        setFeedback(null);
        setSelectedOption(null);
        setAttempts(0);
      } else {
        // No more cards to practice, finish the session
        setIsFinished(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!feedback) {
        handleCheckAnswer(e);
      } else {
        handleNextCard();
      }
    }
  };
  
  const resetQuizState = () => {
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setIsFinished(false);
    setShowConfetti(false);
    setSelectedOption(null);
    setAttempts(0);
  }

  const handleRestart = () => {
    if(set) {
        setShuffledCards(shuffleCards(set.cards));
        resetQuizState();
    }
  }

  const handleShuffle = () => {
    setShuffledCards(shuffleCards(shuffledCards));
    resetQuizState();
  }

  const handleReverseToggle = (checked: boolean) => {
    setIsReversed(checked);
    handleShuffle();
  }

  const handleModeToggle = () => {
    setMultipleChoiceMode(!multipleChoiceMode);
    setFeedback(null);
    setSelectedOption(null);
    setAttempts(0);
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-secondary/50">
          <Header />
          <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <Skeleton className="h-10 w-48 mb-4" />
            <Skeleton className="h-72 w-full max-w-2xl" />
          </main>
        </div>
      </ProtectedRoute>
    );
  }
  
  if (!set || !currentCard) {
     return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-secondary/50">
                <Header />
                <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
                    <p>set not found or has no cards.</p>
                     <Button variant="link" asChild>
                        <Link href="/dashboard">go back to dashboard</Link>
                    </Button>
                </main>
            </div>
        </ProtectedRoute>
     )
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-secondary/50">
        {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
          <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
             <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <Button variant="ghost" asChild>
                    <Link href={`/sets/${setId}/study`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        back to study
                    </Link>
                </Button>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  <Button variant="outline" size="sm" onClick={handleShuffle}>
                    <Shuffle className="mr-2 h-4 w-4" />
                    shuffle
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Switch id="reverse-mode" checked={isReversed} onCheckedChange={handleReverseToggle} />
                    <Label htmlFor="reverse-mode" className="flex items-center gap-2 cursor-pointer">
                      <Repeat className="h-4 w-4"/>
                      swap
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="lenient-mode" checked={lenientMode} onCheckedChange={setLenientMode} />
                    <Label htmlFor="lenient-mode" className="cursor-pointer">
                      lenient mode
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="autoplay-mode" checked={autoplay} onCheckedChange={setAutoplay} />
                    <Label htmlFor="autoplay-mode" className="flex items-center gap-2 cursor-pointer">
                      {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      autoplay
                    </Label>
                  </div>
                  <Button 
                    variant={multipleChoiceMode ? "default" : "outline"} 
                    size="sm" 
                    onClick={handleModeToggle}
                  >
                    {multipleChoiceMode ? 'type answer' : 'multiple choice'}
                  </Button>
                </div>
                 <div className="text-sm text-muted-foreground">
                    card {currentIndex + 1} of {shuffledCards.length}
                    {shuffledCards.length > (set?.cards.length || 0) && (
                      <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                        ({set?.cards.length} original + {shuffledCards.length - (set?.cards.length || 0)} retry)
                      </span>
                    )}
                </div>
            </div>
            <div className="flex-grow flex items-center justify-center">
                {isFinished ? (
                     <Card className="w-full max-w-2xl text-center p-8">
                        <CardTitle className="text-3xl mb-4">YAY!</CardTitle>
                        <p className="text-muted-foreground mb-6">you&rsquo;ve completed this practice set.</p>
                        <Button onClick={handleRestart}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            practice again
                        </Button>
                    </Card>
                ) : (
                    <Card className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl" onClick={() => !multipleChoiceMode && inputRef.current?.focus()}>
                        <CardHeader className="pb-6">
                            <CardTitle className="text-xl lg:text-2xl">{isReversed ? 'Definition:' : 'Term:'}</CardTitle>
                            <p className="text-3xl lg:text-4xl xl:text-5xl pt-6 lg:pt-8 font-medium leading-relaxed">{promptText}</p>
                        </CardHeader>
                        <CardContent>
                            {multipleChoiceMode ? (
                                <div className="space-y-6 lg:space-y-8">
                                    <div>
                                        <label className="font-medium text-lg lg:text-xl">
                                            {isReversed ? 'What is the corresponding term?' : 'What is the corresponding definition?'}
                                        </label>
                                        <div className="mt-4 lg:mt-6 grid grid-cols-2 gap-4">
                                            {multipleChoiceOptions.map((option, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleMultipleChoiceSelect(option)}
                                                    disabled={feedback !== null}
                                                                                                            className={cn(
                                                            "p-4 lg:p-6 text-lg lg:text-xl font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105",
                                                            "bg-card text-card-foreground border-border hover:border-primary",
                                                            selectedOption === option && feedback === 'correct' && "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100",
                                                            selectedOption === option && feedback === 'try-again' && "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100",
                                                            selectedOption === option && !feedback && "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100",
                                                            feedback && option === answerText && "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100"
                                                        )}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {feedback && (
                                        <div className={cn(
                                            "mt-4 p-4 rounded-md text-center flex flex-col items-center animate-in slide-in-from-bottom-2 duration-300",
                                            feedback === 'correct' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
                                        )}>
                                            {feedback === 'correct' ? (
                                                <div className="flex items-center text-green-700 dark:text-green-300 animate-in zoom-in-50 duration-500 delay-200">
                                                    <CheckCircle2 className="h-6 w-6 mr-2 animate-in zoom-in-50 duration-500 delay-100"/>
                                                    <p className="font-bold text-lg animate-in slide-in-from-left-2 duration-500 delay-300">correct!</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-yellow-700 dark:text-yellow-300">
                                                    <div className="flex items-center">
                                                        <XCircle className="h-6 w-6 mr-2"/>
                                                        <p className="font-bold text-lg">so close, try again!</p>
                                                    </div>
                                                </div>
                                            )}
                                            {!autoplay && (
                                                <Button onClick={handleNextCard} className="mt-4 w-1/2 animate-in slide-in-from-bottom-2 duration-500 delay-400">
                                                    next
                                                </Button>
                                            )}
                                            {/* {autoplay && (
                                                <p className="mt-4 text-sm text-muted-foreground animate-in slide-in-from-bottom-2 duration-500 delay-400">
                                                    advancing automatically...
                                                </p>
                                            )} */}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleCheckAnswer} className="space-y-6 lg:space-y-8">
                                    <div>
                                        <label htmlFor="answer" className="font-medium text-lg lg:text-xl">
                                            {isReversed ? 'What is the corresponding term?' : 'What is the corresponding definition?'}
                                        </label>
                                        <div className="mt-4 lg:mt-6 relative">
                                            <input
                                                ref={inputRef}
                                                id="answer"
                                                value={userAnswer}
                                                onChange={(e) => {
                                                    if (!feedback) {
                                                        setUserAnswer(e.target.value);
                                                    }
                                                }}
                                                onKeyDown={handleKeyDown}
                                                onFocus={() => inputRef.current?.focus()}
                                                onBlur={() => {
                                                    // Re-focus after a short delay to maintain focus
                                                    setTimeout(() => {
                                                        if (inputRef.current && !feedback) {
                                                            inputRef.current.focus();
                                                        }
                                                    }, 50);
                                                }}
                                                placeholder="type your answer"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-text border-0 focus:ring-0 focus:border-0 focus:outline-none bg-transparent text-transparent"
                                                autoComplete="off"
                                                autoCorrect="off"
                                                autoCapitalize="off"
                                                spellCheck="false"
                                            />
                                            <div className="min-h-[48px] lg:min-h-[56px] flex items-center">
                                                {userAnswer ? (
                                                    <span 
                                                        className="text-xl lg:text-2xl xl:text-3xl font-bold"
                                                        style={{ 
                                                            fontSize: '28px',
                                                            lineHeight: '1.2'
                                                        }}
                                                    >
                                                        {userAnswer}
                                                    </span>
                                                ) : (
                                                    <span className="text-xl lg:text-2xl text-muted-foreground">
                                                        type your answer
                                                    </span>
                                                )}
                                                {!feedback && (
                                                    <span className="ml-2 w-1 h-8 lg:h-10 bg-gray-400 dark:bg-gray-300 animate-pulse"></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!feedback && (
                                        <Button type="submit" className="w-full text-lg lg:text-xl py-6 lg:py-8">
                                            check!
                                        </Button>
                                    )}
                                </form>
                            )}
                            {feedback && !multipleChoiceMode && (
                                <div className={cn(
                                    "mt-4 p-4 rounded-md text-center flex flex-col items-center animate-in slide-in-from-bottom-2 duration-300",
                                    feedback === 'correct' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
                                )}>
                                    {feedback === 'correct' ? (
                                        <div className="flex items-center text-green-700 dark:text-green-300 animate-in zoom-in-50 duration-500 delay-200">
                                            <CheckCircle2 className="h-6 w-6 mr-2 animate-in zoom-in-50 duration-500 delay-100"/>
                                            <p className="font-bold text-lg animate-in slide-in-from-left-2 duration-500 delay-300">correct!</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-yellow-700 dark:text-yellow-300">
                                            <div className="flex items-center">
                                                <XCircle className="h-6 w-6 mr-2"/>
                                                <p className="font-bold text-lg">so close, try again!</p>
                                            </div>
                                            <p className="mt-2">the correct answer is: <strong className="font-bold">{answerText}</strong></p>
                                        </div>
                                    )}
                                    {!autoplay && (
                                        <Button onClick={handleNextCard} className="mt-4 w-1/2 animate-in slide-in-from-bottom-2 duration-500 delay-400">
                                            next
                                        </Button>
                                    )}
                                    {/* {autoplay && (
                                        <p className="mt-4 text-sm text-muted-foreground animate-in slide-in-from-bottom-2 duration-500 delay-400">
                                            advancing automatically...
                                        </p>
                                    )} */}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
