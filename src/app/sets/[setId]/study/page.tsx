"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { getFlashcardSet, type FlashcardSet, type Card as CardType } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Shuffle, Repeat } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function StudyPage() {
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [shuffledCards, setShuffledCards] = useState<CardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReversed, setIsReversed] = useState(false);

  const shuffleCards = useCallback((cards: CardType[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
  }, []);

  useEffect(() => {
    const fetchSet = async () => {
      setLoading(true);
      const fetchedSet = await getFlashcardSet(setId);
      if (fetchedSet) {
        // For shared sets, we don't need to check user ID
        setSet(fetchedSet);
        setShuffledCards(shuffleCards(fetchedSet.cards));
      } else {
        router.push('/dashboard');
      }
      setLoading(false);
    };

    if (setId) {
      fetchSet();
    }
  }, [setId, router, shuffleCards]);

  const currentCard = useMemo(() => shuffledCards[currentIndex], [shuffledCards, currentIndex]);

  const promptText = isReversed ? currentCard?.front : currentCard?.back;
  const answerText = isReversed ? currentCard?.back : currentCard?.front;
  
  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || feedback) return;

    if (userAnswer.trim().toLowerCase() === answerText.trim().toLowerCase()) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const handleNextCard = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setFeedback(null);
    } else {
      setIsFinished(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };
  
  const handleRestart = () => {
    setShuffledCards(shuffleCards(set!.cards));
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setIsFinished(false);
    setShowConfetti(false);
  }

  const handleShuffle = () => {
    setShuffledCards(shuffleCards(shuffledCards));
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setIsFinished(false);
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen bg-secondary/50">
          <Header />
          <main className="flex-1 container py-8 flex flex-col items-center justify-center">
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
                <main className="flex-1 container py-8 text-center">
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
        <main className="flex-1 container py-8 flex flex-col">
          <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
             <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        back to dashboard
                    </Link>
                </Button>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={handleShuffle}>
                    <Shuffle className="mr-2 h-4 w-4" />
                    shuffle
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Switch id="reverse-mode" checked={isReversed} onCheckedChange={setIsReversed} />
                    <Label htmlFor="reverse-mode" className="flex items-center gap-2 cursor-pointer">
                      <Repeat className="h-4 w-4"/>
                      swap
                    </Label>
                  </div>
                </div>
                 <div className="text-sm text-muted-foreground">
                    card {currentIndex + 1} of {shuffledCards.length}
                </div>
            </div>
            <div className="flex-grow flex items-center justify-center">
                {isFinished ? (
                     <Card className="w-full max-w-2xl text-center p-8">
                        <CardTitle className="text-3xl mb-4">YAY!</CardTitle>
                        <p className="text-muted-foreground mb-6">you've completed this study set.</p>
                        <Button onClick={handleRestart}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            study again
                        </Button>
                    </Card>
                ) : (
                    <Card className="w-full max-w-2xl">
                        <CardHeader>
                            <CardTitle>{isReversed ? 'term:' : 'definition:'}</CardTitle>
                            <p className="text-2xl pt-4">{promptText}</p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCheckAnswer} className="space-y-4">
                                <div>
                                    <label htmlFor="answer" className="font-medium">
                                        {isReversed ? 'what is the corresponding definition?' : 'what is the corresponding term?'}
                                    </label>
                                    <Input
                                        id="answer"
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder="type your answer"
                                        className="mt-2 text-lg"
                                        disabled={!!feedback}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={!!feedback}>
                                    check!
                                </Button>
                            </form>
                            {feedback && (
                                <div className={cn(
                                    "mt-4 p-4 rounded-md text-center flex flex-col items-center",
                                    feedback === 'correct' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
                                )}>
                                    {feedback === 'correct' ? (
                                        <div className="flex items-center text-green-700 dark:text-green-300">
                                            <CheckCircle2 className="h-6 w-6 mr-2"/>
                                            <p className="font-bold text-lg">correct!</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-red-700 dark:text-red-300">
                                            <div className="flex items-center">
                                                <XCircle className="h-6 w-6 mr-2"/>
                                                <p className="font-bold text-lg">incorrect</p>
                                            </div>
                                            <p className="mt-2">the correct answer is: <strong className="font-bold">{answerText}</strong></p>
                                        </div>
                                    )}
                                    <Button onClick={handleNextCard} className="mt-4 w-1/2">
                                        next
                                    </Button>
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
