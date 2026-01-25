"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { getFlashcardSet, type FlashcardSet, type Card as CardType } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Shuffle, Repeat, Play, Pause, ChevronDown, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { useTrackCardStudied, useTrackSetCardStudied, useSetCardPerformance, useSetProgress } from '@/hooks/use-stats-queries';
import { ThumbsUp, ThumbsDown, Filter } from 'lucide-react';
import { getCardPerformance } from '@/services/set-progress';

type CardFilter = 'all' | 'weak' | 'strong';

export default function PracticePage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleCorrectAnswer, handleToggleOn, handleToggleOff, enableSounds } = useSoundEffects();
  const trackCardStudied = useTrackCardStudied();
  const trackSetCardStudied = useTrackSetCardStudied();
  const setCardPerformanceMutation = useSetCardPerformance();
  const { data: setProgress } = useSetProgress(setId);

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
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
  const [retryCardIds, setRetryCardIds] = useState<Set<string>>(new Set());
  const [trackedCards, setTrackedCards] = useState<Set<string>>(new Set());
  const [currentCardPerformance, setCurrentCardPerformance] = useState<'weak' | 'strong' | null>(null);

  const shuffleCards = useCallback((cards: CardType[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
  }, []);

  // Filter cards based on performance
  const filterCardsByPerformance = useCallback((cards: CardType[], filter: CardFilter) => {
    if (filter === 'all' || !setProgress) return cards;
    
    return cards.filter(card => {
      const performance = getCardPerformance(setProgress, card.id);
      return performance === filter;
    });
  }, [setProgress]);

  // Get counts for filter badges
  const getFilterCounts = useCallback(() => {
    if (!set || !setProgress) return { all: set?.cards.length || 0, weak: 0, strong: 0 };
    
    let weak = 0;
    let strong = 0;
    
    set.cards.forEach(card => {
      const performance = getCardPerformance(setProgress, card.id);
      if (performance === 'weak') weak++;
      else if (performance === 'strong') strong++;
    });
    
    return { all: set.cards.length, weak, strong };
  }, [set, setProgress]);

  const filterCounts = getFilterCounts();

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
        // Initial load always shows all cards (filter will be applied via handleFilterChange)
        setShuffledCards(shuffleCards(fetchedSet.cards));
        setRetryCardIds(new Set());
      } else {
        router.push('/dashboard');
      }
      setLoading(false);
    };

    if (setId && user) {
      fetchSet();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId, user]);

  // Re-filter when filter changes (user interaction)
  const handleFilterChange = useCallback((filter: CardFilter) => {
    if (set) {
      const filtered = filterCardsByPerformance(set.cards, filter);
      setShuffledCards(shuffleCards(filtered));
      setCurrentIndex(0);
      setUserAnswer('');
      setFeedback(null);
      setSelectedOption(null);
      setAttempts(0);
      setRetryCardIds(new Set());
      setIsFinished(false);
      setCurrentCardPerformance(null);
    }
    setCardFilter(filter);
  }, [set, filterCardsByPerformance, shuffleCards]);

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
    
    enableSounds(); // Enable sounds on first user interaction
    const userAnswerClean = lenientMode ? cleanString(userAnswer) : userAnswer.trim().toLowerCase();
    const answerTextClean = lenientMode ? cleanString(answerText) : answerText.trim().toLowerCase();

    if (userAnswerClean === answerTextClean) {
      setFeedback('correct');
      setCurrentCardPerformance('strong');
      handleCorrectAnswer(); // Play correct answer sound
      
      // Track card when answered correctly (only once per card)
      if (currentCard && user && !trackedCards.has(currentCard.id)) {
        setTrackedCards(prev => new Set(prev).add(currentCard.id));
        trackCardStudied.mutate();
        trackSetCardStudied.mutate({ setId, cardId: currentCard.id });
      }
      
      // Auto-set performance to strong
      if (currentCard && user) {
        setCardPerformanceMutation.mutate({ setId, cardId: currentCard.id, performance: 'strong' });
      }
    } else {
      setFeedback('try-again');
      setCurrentCardPerformance('weak');
      
      // Auto-set performance to weak
      if (currentCard && user) {
        setCardPerformanceMutation.mutate({ setId, cardId: currentCard.id, performance: 'weak' });
      }
      
      // Only append the card if it hasn't been added as a retry card yet
      if (!retryCardIds.has(currentCard.id)) {
        setRetryCardIds(prev => new Set(prev).add(currentCard.id));
        setShuffledCards(prev => [...prev, currentCard]);
      }
    }
  };

  const handleMultipleChoiceSelect = (selectedAnswer: string) => {
    if (feedback || !currentCard) return;
    
    enableSounds(); // Enable sounds on first user interaction
    setSelectedOption(selectedAnswer);
    
    if (selectedAnswer === answerText) {
      setFeedback('correct');
      setCurrentCardPerformance('strong');
      setAttempts(0);
      handleCorrectAnswer(); // Play correct answer sound
      
      // Track card when answered correctly (only once per card)
      if (currentCard && user && !trackedCards.has(currentCard.id)) {
        setTrackedCards(prev => new Set(prev).add(currentCard.id));
        trackCardStudied.mutate();
        trackSetCardStudied.mutate({ setId, cardId: currentCard.id });
      }
      
      // Auto-set performance to strong
      if (currentCard && user) {
        setCardPerformanceMutation.mutate({ setId, cardId: currentCard.id, performance: 'strong' });
      }
    } else {
      setAttempts(prev => prev + 1);
      setCurrentCardPerformance('weak');
      
      // Auto-set performance to weak
      if (currentCard && user) {
        setCardPerformanceMutation.mutate({ setId, cardId: currentCard.id, performance: 'weak' });
      }
      
      // Only append the card if it hasn't been added as a retry card yet
      if (!retryCardIds.has(currentCard.id)) {
        setRetryCardIds(prev => new Set(prev).add(currentCard.id));
        setShuffledCards(prev => [...prev, currentCard]);
      }
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
      setCurrentCardPerformance(null);
    } else {
      // We've reached the last card, finish the session
      setIsFinished(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
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
  
  // Override card performance (user manually marks as strong/weak)
  const handleOverridePerformance = (performance: 'weak' | 'strong') => {
    if (!currentCard || !user) return;
    setCurrentCardPerformance(performance);
    setCardPerformanceMutation.mutate({ setId, cardId: currentCard.id, performance });
  };
  
  const resetQuizState = () => {
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setIsFinished(false);
    setShowConfetti(false);
    setSelectedOption(null);
    setAttempts(0);
    setRetryCardIds(new Set());
    setTrackedCards(new Set());
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
    enableSounds(); // Enable sounds on first user interaction
    if (checked) {
      handleToggleOn();
    } else {
      handleToggleOff();
    }
    setIsReversed(checked);
  }

  const handleLenientModeToggle = (checked: boolean) => {
    enableSounds(); // Enable sounds on first user interaction
    if (checked) {
      handleToggleOn();
    } else {
      handleToggleOff();
    }
    setLenientMode(checked);
  };

  const handleAutoplayToggle = (checked: boolean) => {
    enableSounds(); // Enable sounds on first user interaction
    if (checked) {
      handleToggleOn();
    } else {
      handleToggleOff();
    }
    setAutoplay(checked);
  };

  const handleModeToggle = () => {
    setMultipleChoiceMode(!multipleChoiceMode);
    setFeedback(null);
    setSelectedOption(null);
    setAttempts(0);
    setRetryCardIds(new Set());
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
  
  if (!set) {
     return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-secondary/50">
                <Header />
                <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
                    <p>set not found.</p>
                     <Button variant="link" asChild>
                        <Link href="/dashboard">go back to dashboard</Link>
                    </Button>
                </main>
            </div>
        </ProtectedRoute>
     )
  }
  
  // Handle empty filtered cards (but not when finished)
  if (shuffledCards.length === 0 && !isFinished) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-secondary/50">
          <Header />
          <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            <Card className="max-w-md p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">
                {cardFilter === 'all' ? 'No cards in this set' : `No ${cardFilter} cards`}
              </h2>
              <p className="text-muted-foreground mb-4">
                {cardFilter !== 'all' 
                  ? `You don't have any cards marked as "${cardFilter}" yet. Practice more to categorize your cards!`
                  : 'This set has no cards to practice.'}
              </p>
              {cardFilter !== 'all' && (
                <Button onClick={() => handleFilterChange('all')}>
                  Show all cards
                </Button>
              )}
              {cardFilter === 'all' && (
                <Button variant="link" asChild>
                  <Link href="/dashboard">go back to dashboard</Link>
                </Button>
              )}
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
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
                
                {/* Options Menu - Hover to reveal */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-5 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50 hover:border-border transition-all duration-200">
                    <Settings2 className="h-3.5 w-3.5" />
                    <span className="font-medium">options</span>
                    <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  
                  {/* Dropdown panel */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 min-w-[280px]">
                      {/* Controls */}
                      <div className="space-y-3">
                        <Button variant="outline" size="sm" onClick={handleShuffle} className="w-full justify-start">
                          <Shuffle className="mr-2 h-4 w-4" />
                          shuffle
                        </Button>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="reverse-mode" className="flex items-center gap-2 cursor-pointer text-sm">
                            <Repeat className="h-4 w-4"/>
                            swap term/definition
                          </Label>
                          <Switch id="reverse-mode" checked={isReversed} onCheckedChange={handleReverseToggle} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="lenient-mode" className="cursor-pointer text-sm">
                            lenient mode
                          </Label>
                          <Switch id="lenient-mode" checked={lenientMode} onCheckedChange={handleLenientModeToggle} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="autoplay-mode" className="flex items-center gap-2 cursor-pointer text-sm">
                            {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            autoplay
                          </Label>
                          <Switch id="autoplay-mode" checked={autoplay} onCheckedChange={handleAutoplayToggle} />
                        </div>
                        
                        <div className="pt-2 border-t">
                          <Button 
                            variant={multipleChoiceMode ? "default" : "outline"} 
                            size="sm" 
                            onClick={handleModeToggle}
                            className="w-full"
                          >
                            {multipleChoiceMode ? 'type answer' : 'multiple choice'}
                          </Button>
                        </div>
                        
                        {/* Card Filter */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Filter className="h-3 w-3" />
                            Filter Cards
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant={cardFilter === 'all' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleFilterChange('all')}
                              className="flex-1 text-xs"
                            >
                              All ({filterCounts.all})
                            </Button>
                            <Button
                              variant={cardFilter === 'weak' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleFilterChange('weak')}
                              className="flex-1 text-xs"
                              disabled={filterCounts.weak === 0}
                            >
                              Weak ({filterCounts.weak})
                            </Button>
                            <Button
                              variant={cardFilter === 'strong' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleFilterChange('strong')}
                              className="flex-1 text-xs"
                              disabled={filterCounts.strong === 0}
                            >
                              Strong ({filterCounts.strong})
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
            
            {/* Filter Toggle Bar */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground mr-1">
                <Filter className="h-3 w-3 inline mr-1" />
                Show:
              </span>
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    cardFilter === 'all' 
                      ? 'bg-background shadow-sm font-medium' 
                      : 'hover:bg-background/50 text-muted-foreground'
                  }`}
                >
                  All ({filterCounts.all})
                </button>
                <button
                  onClick={() => handleFilterChange('weak')}
                  disabled={filterCounts.weak === 0}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    cardFilter === 'weak' 
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 shadow-sm font-medium' 
                      : filterCounts.weak === 0 
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground'
                  }`}
                >
                  Weak ({filterCounts.weak})
                </button>
                <button
                  onClick={() => handleFilterChange('strong')}
                  disabled={filterCounts.strong === 0}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    cardFilter === 'strong' 
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shadow-sm font-medium' 
                      : filterCounts.strong === 0 
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-muted-foreground'
                  }`}
                >
                  Strong ({filterCounts.strong})
                </button>
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
                                            
                                            {/* Override buttons */}
                                            <div className="flex gap-2 mt-3 animate-in fade-in duration-300 delay-300">
                                                <span className="text-xs text-muted-foreground self-center mr-1">
                                                    marked as {currentCardPerformance === 'strong' ? 'strong' : 'weak'}
                                                </span>
                                                {currentCardPerformance === 'weak' ? (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleOverridePerformance('strong')}
                                                        className="text-xs"
                                                    >
                                                        <ThumbsUp className="h-3 w-3 mr-1" />
                                                        I know this
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleOverridePerformance('weak')}
                                                        className="text-xs"
                                                    >
                                                        <ThumbsDown className="h-3 w-3 mr-1" />
                                                        still learning
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            {!autoplay && (
                                                <Button onClick={handleNextCard} className="mt-4 w-1/2 animate-in slide-in-from-bottom-2 duration-500 delay-400">
                                                    next
                                                </Button>
                                            )}
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
                                    
                                    {/* Override buttons */}
                                    <div className="flex gap-2 mt-3 animate-in fade-in duration-300 delay-300">
                                        <span className="text-xs text-muted-foreground self-center mr-1">
                                            marked as {currentCardPerformance === 'strong' ? 'strong' : 'weak'}
                                        </span>
                                        {currentCardPerformance === 'weak' ? (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleOverridePerformance('strong')}
                                                className="text-xs"
                                            >
                                                <ThumbsUp className="h-3 w-3 mr-1" />
                                                I know this
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleOverridePerformance('weak')}
                                                className="text-xs"
                                            >
                                                <ThumbsDown className="h-3 w-3 mr-1" />
                                                still learning
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {!autoplay && (
                                        <Button onClick={handleNextCard} className="mt-4 w-1/2 animate-in slide-in-from-bottom-2 duration-500 delay-400">
                                            next
                                        </Button>
                                    )}
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
