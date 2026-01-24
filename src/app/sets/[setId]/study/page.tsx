"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { getFlashcardSet, type FlashcardSet, type Card as CardType, updateFlashcardSet } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, RotateCcw, Shuffle, Repeat, BookOpen, Gamepad2, FileText, Zap, ChevronDown, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ResponsiveText } from '@/components/responsive-text';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { useTrackCardStudied } from '@/hooks/use-stats-queries';

export default function StudyPage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { handleHoverStart, handleHoverEnd, handleToggleOn, handleToggleOff, enableSounds } = useSoundEffects();
  const trackCardStudied = useTrackCardStudied();

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [shuffledCards, setShuffledCards] = useState<CardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editDefinition, setEditDefinition] = useState('');
  const [trackedCards, setTrackedCards] = useState<Set<string>>(new Set());

  const shuffleCards = useCallback((cards: CardType[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
  }, []);

  const handleSaveCard = async (cardIndex: number) => {
    if (!set) return;
    
    try {
      // Create updated cards array
      const updatedCards = [...set.cards];
      updatedCards[cardIndex] = {
        ...updatedCards[cardIndex],
        front: editTerm,
        back: editDefinition
      };

      // Update database
      await updateFlashcardSet(setId, { cards: updatedCards });
      
      // Update local state
      setSet(prev => prev ? { ...prev, cards: updatedCards } : null);
      setShuffledCards(prev => shuffleCards(updatedCards));
      
      // Exit edit mode
      setEditingCard(null);
      setEditTerm('');
      setEditDefinition('');
    } catch (error) {
      console.error('Failed to update card:', error);
      // You could add a toast notification here for error feedback
    }
  };

  useEffect(() => {
    const fetchSet = async () => {
      setLoading(true);
      const fetchedSet = await getFlashcardSet(setId);
      if (fetchedSet) {
        // Allow access if: user owns the set, set is shared, or set is public
        if (!fetchedSet.shared && !fetchedSet.isPublic && fetchedSet.userId !== user?.uid) {
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

  const currentCard = shuffledCards[currentIndex];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle keyboard shortcuts when user is typing in an input field
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    switch (e.key) {
      case ' ':
        e.preventDefault();
        setIsFlipped(prev => !prev);
        break;
      case 'Enter':
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < shuffledCards.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setIsFlipped(false);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setIsFlipped(false);
        }
        break;
    }
  }, [currentIndex, shuffledCards.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNext = () => {
    enableSounds(); // Enable sounds on first user interaction
    if (currentIndex < shuffledCards.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
        setIsTransitioning(false);
        
        // Track card when moving to next (if not already tracked)
        const nextCard = shuffledCards[nextIndex];
        if (nextCard && user && !trackedCards.has(nextCard.id)) {
          setTrackedCards(prev => new Set(prev).add(nextCard.id));
          trackCardStudied.mutate();
        }
      }, 150);
    }
  };

  const handlePrevious = () => {
    enableSounds(); // Enable sounds on first user interaction
    if (currentIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsFlipped(false);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleFlip = () => {
    enableSounds(); // Enable sounds on first user interaction
    setIsFlipped(prev => !prev);
    
    // Track card when flipped (first time viewing the back)
    if (!isFlipped && currentCard && user && !trackedCards.has(currentCard.id)) {
      setTrackedCards(prev => new Set(prev).add(currentCard.id));
      trackCardStudied.mutate();
    }
  };

  const handleRestart = () => {
    if (set) {
      setShuffledCards(shuffleCards(set.cards));
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    setShuffledCards(shuffleCards(shuffledCards));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReverseToggle = (checked: boolean) => {
    enableSounds(); // Enable sounds on first user interaction
    if (checked) {
      handleToggleOn();
    } else {
      handleToggleOff();
    }
    setIsReversed(checked);
  };

  const handleProgressToggle = (checked: boolean) => {
    enableSounds(); // Enable sounds on first user interaction
    if (checked) {
      handleToggleOn();
    } else {
      handleToggleOff();
    }
    setShowProgress(checked);
  };

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

  const frontText = isReversed ? currentCard.back : currentCard.front;
  const backText = isReversed ? currentCard.front : currentCard.back;

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-secondary/50">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col">
          <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
             <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        back to dashboard
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
                          <Label htmlFor="progress-toggle" className="flex items-center gap-2 cursor-pointer text-sm">
                            <div className="w-4 h-1 bg-current rounded-full"/>
                            show progress
                          </Label>
                          <Switch id="progress-toggle" checked={showProgress} onCheckedChange={handleProgressToggle} />
                        </div>
                      </div>
                      
                      {/* Keyboard Shortcuts */}
                      <div className="mt-4 pt-3 border-t">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Keyboard Shortcuts</div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">Space</kbd>
                            <span>flip</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">←</kbd>
                            <span>previous</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">→</kbd>
                            <span>next</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">Enter</kbd>
                            <span>next</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                 <div className="text-sm text-muted-foreground">
                    card {currentIndex + 1} of {shuffledCards.length}
                </div>
            </div>

            {/* Progress Bar */}
            {showProgress && shuffledCards.length > 1 && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{currentIndex + 1} / {shuffledCards.length}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-grow flex items-center justify-center">
              <div className="w-full max-w-2xl flex flex-col items-center">
                <div className="w-full min-h-[400px] mb-6 perspective-1000">
                  <Card 
                    className={`w-full min-h-[400px] flex flex-col cursor-pointer hover:shadow-lg transform-style-preserve-3d ${
                      isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                    }`}
                    onClick={handleFlip}
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'opacity 0.15s ease-in-out, transform 0.3s ease-in-out',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Front of card */}
                    <CardContent 
                      className="flex-grow flex items-center justify-center p-8 absolute inset-0 backface-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden' // Ensure card content doesn't overflow
                      }}
                    >
                      <div className="text-center w-full h-full flex items-center justify-center">
                        <ResponsiveText 
                          text={frontText}
                          className="font-bold leading-relaxed"
                          baseFontSize="text-3xl"
                        />
                      </div>
                    </CardContent>

                    {/* Back of card */}
                    <CardContent 
                      className="flex-grow flex items-center justify-center p-8 absolute inset-0 backface-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden' // Ensure card content doesn't overflow
                      }}
                    >
                      <div className="text-center w-full h-full flex items-center justify-center">
                        <ResponsiveText 
                          text={backText}
                          className="font-medium leading-relaxed"
                          baseFontSize="text-3xl"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Navigation Buttons - Separate from card */}
                <div className="flex items-center justify-between w-full gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    previous
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleRestart}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    restart
                  </Button>
                  
                  <Button 
                    onClick={handleNext}
                    disabled={currentIndex === shuffledCards.length - 1}
                    className="flex items-center gap-2"
                  >
                    next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Study Mode Buttons */}
                <div className="flex items-center justify-center gap-4 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/sets/${setId}/practice`)}
                    onMouseEnter={() => {
                      enableSounds();
                      handleHoverStart();
                    }}
                    onMouseLeave={handleHoverEnd}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Practice
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/sets/${setId}/play`)}
                    onMouseEnter={() => {
                      enableSounds();
                      handleHoverStart();
                    }}
                    onMouseLeave={handleHoverEnd}
                    className="flex items-center gap-2"
                    title="Raining Words - Catch falling words and match them before they hit the ground"
                  >
                    <Gamepad2 className="h-4 w-4" />
                    Raining Words
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/sets/${setId}/speed`)}
                    onMouseEnter={() => {
                      enableSounds();
                      handleHoverStart();
                    }}
                    onMouseLeave={handleHoverEnd}
                    className="flex items-center gap-2"
                    title="Speed Mode - Type the term before time runs out"
                  >
                    <Zap className="h-4 w-4" />
                    Speed
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/sets/${setId}/test`)}
                    onMouseEnter={() => {
                      enableSounds();
                      handleHoverStart();
                    }}
                    onMouseLeave={handleHoverEnd}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Test
                  </Button>
                </div>

                {/* All Cards List */}
                <div className="w-full max-w-4xl mt-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-foreground">All Cards in Set</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {set.cards.length} card{set.cards.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {set.cards.map((card, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-stretch">
                            <div className="flex-1 pr-4">
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Term
                                </div>
                                {editingCard === index ? (
                                  <input
                                    type="text"
                                    value={editTerm}
                                    onChange={(e) => setEditTerm(e.target.value)}
                                    className="w-full p-2 border rounded-md text-base font-medium dark:text-black"
                                    autoFocus
                                  />
                                ) : (
                                  <div 
                                    className="text-base font-medium text-foreground break-words cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                                    onDoubleClick={() => {
                                      setEditingCard(index);
                                      setEditTerm(card.front);
                                      setEditDefinition(card.back);
                                    }}
                                  >
                                    {card.front}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="w-px bg-border mx-2 flex-shrink-0" />
                            <div className="flex-1 pl-4">
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Definition
                                </div>
                                {editingCard === index ? (
                                  <input
                                    type="text"
                                    value={editDefinition}
                                    onChange={(e) => setEditDefinition(e.target.value)}
                                    className="w-full p-2 border rounded-md text-base dark:text-black"
                                  />
                                ) : (
                                  <div 
                                    className="text-base text-foreground break-words cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                                    onDoubleClick={() => {
                                      setEditingCard(index);
                                      setEditTerm(card.front);
                                      setEditDefinition(card.back);
                                    }}
                                  >
                                    {card.back}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Edit Actions */}
                          {editingCard === index && (
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCard(null);
                                  setEditTerm('');
                                  setEditDefinition('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveCard(index)}
                              >
                                Save
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                    {/* Return to Top Button */}
                    <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="flex items-center gap-2"
                    >
                      ↑ Return to Top
                    </Button>
                  </div>
                </div> {/* end E: All Cards List */}
              </div> {/* end C: inner max-w-2xl column */}
            </div> {/* end B: center row */}
          </div> {/* end A: main max-w-4xl column */}
        </main>
      </div> {/* end outer page container */}
    </ProtectedRoute>
  );
}
