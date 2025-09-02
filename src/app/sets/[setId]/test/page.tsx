"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { getFlashcardSet, type FlashcardSet, type Card as CardType } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';

type QuestionType = 'multiple-choice' | 'true-false' | 'written';

interface BaseQuestion {
  id: string;
  type: QuestionType;
  card: CardType;
  prompt: string;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
  answer: string;
}

interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  isTrue: boolean;
  answer: boolean;
}

interface WrittenQuestion extends BaseQuestion {
  type: 'written';
  answer: string;
}

type Question = MultipleChoiceQuestion | TrueFalseQuestion | WrittenQuestion;

type UserAnswers = { [key: string]: string | boolean };

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

export default function TestPage() {
    const params = useParams();
    const setId = params.setId as string;
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();

    const [set, setSet] = useState<FlashcardSet | null>(null);
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    const generateTest = useCallback((cards: CardType[]) => {
        const selectedCards = shuffleArray(cards).slice(0, 15);
        if (selectedCards.length < 4) {
             toast({ title: "Not enough cards", description: "You need at least 4 cards to generate a test.", variant: "destructive" });
             router.push(`/dashboard`);
             return;
        }

        const newQuestions: Question[] = [];
        
        // 5 multiple choice
        const mcCards = selectedCards.slice(0, 5);
        mcCards.forEach(card => {
            const wrongAnswers = shuffleArray(cards.filter(c => c.id !== card.id))
                .slice(0, 3)
                .map(c => c.back);
            const options = shuffleArray([card.back, ...wrongAnswers]);
            newQuestions.push({
                id: `mc-${card.id}`,
                type: 'multiple-choice',
                card,
                prompt: card.front,
                options,
                answer: card.back
            });
        });

        // 5 true/false
        const tfCards = selectedCards.slice(5, 10);
         tfCards.forEach(card => {
            const isTrue = Math.random() > 0.5;
            let promptBack;
            if (isTrue) {
                promptBack = card.back;
            } else {
                const wrongCard = shuffleArray(cards.filter(c => c.id !== card.id))[0];
                promptBack = wrongCard.back;
            }
            newQuestions.push({
                id: `tf-${card.id}`,
                type: 'true-false',
                card,
                prompt: `${card.front}: ${promptBack}`,
                isTrue: promptBack === card.back,
                answer: promptBack === card.back
            });
        });

        // 5 written
        const writtenCards = selectedCards.slice(10, 15);
        writtenCards.forEach(card => {
            newQuestions.push({
                id: `w-${card.id}`,
                type: 'written',
                card,
                prompt: card.front,
                answer: card.back
            });
        });

        setQuestions(shuffleArray(newQuestions));
        setUserAnswers({});
        setSubmitted(false);
        setScore(0);
    }, [router, toast]);

    useEffect(() => {
        const fetchSet = async () => {
            setLoading(true);
            const fetchedSet = await getFlashcardSet(setId);
            if (fetchedSet) {
                // Allow access if: user owns the set, set is shared, or set is public
        if (!fetchedSet.shared && !fetchedSet.isPublic && fetchedSet.userId !== user?.uid) {
                    toast({ title: "Unauthorized", description: "You don't have access to this set." });
                    return router.push('/dashboard');
                }
                setSet(fetchedSet);
                generateTest(fetchedSet.cards);
            } else {
                toast({ title: "Error", description: "Set not found." });
                router.push('/dashboard');
            }
            setLoading(false);
        };

        if (setId && user) {
            fetchSet();
        }
    }, [setId, user, router, toast, generateTest]);

    const handleAnswerChange = (questionId: string, answer: string | boolean) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let correctCount = 0;
        questions.forEach(q => {
            const userAnswer = userAnswers[q.id];
            if (userAnswer === undefined) return;

            let isCorrect = false;
            if (q.type === 'multiple-choice' || q.type === 'written') {
                isCorrect = typeof userAnswer === 'string' && userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
            } else if (q.type === 'true-false') {
                isCorrect = userAnswer === q.answer;
            }

            if (isCorrect) {
                correctCount++;
            }
        });
        
        const finalScore = Math.round((correctCount / questions.length) * 100);
        setScore(finalScore);
        setSubmitted(true);
        if (finalScore > 80) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }
    };
    
    const handleRetake = () => {
      if(set) generateTest(set.cards);
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex flex-col min-h-screen bg-secondary/50">
                    <Header />
                    <main className="flex-1 container py-8">
                        <Skeleton className="h-8 w-48 mb-6" />
                        <Card>
                            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                            <CardContent className="space-y-6">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                            </CardContent>
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
                 <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <Button variant="ghost" asChild className="mb-4">
                            <Link href="/dashboard">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                back to dashboard
                            </Link>
                        </Button>

                        {!submitted ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-3xl">test: {set?.title}</CardTitle>
                                    <CardDescription>answer the questions below to the best of your ability.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        {questions.map((q, index) => (
                                            <div key={q.id} className="p-4 border rounded-lg">
                                                <p className="font-semibold mb-3">question {index + 1}: {q.type === 'true-false' ? "is this statement true or false?" : ""}</p>
                                                
                                                <Label htmlFor={q.id} className="text-lg mb-4 block">{q.prompt}</Label>

                                                {q.type === 'multiple-choice' && (
                                                    <RadioGroup onValueChange={(val) => handleAnswerChange(q.id, val)} id={q.id}>
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} className="flex items-center space-x-2">
                                                                <RadioGroupItem value={opt} id={`${q.id}-opt-${i}`} />
                                                                <Label htmlFor={`${q.id}-opt-${i}`}>{opt}</Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                )}

                                                {q.type === 'true-false' && (
                                                     <RadioGroup onValueChange={(val) => handleAnswerChange(q.id, val === 'true')} id={q.id}>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="true" id={`${q.id}-true`} />
                                                            <Label htmlFor={`${q.id}-true`}>true</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="false" id={`${q.id}-false`} />
                                                            <Label htmlFor={`${q.id}-false`}>false</Label>
                                                        </div>
                                                    </RadioGroup>
                                                )}

                                                {q.type === 'written' && (
                                                    <Input 
                                                        id={q.id} 
                                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)} 
                                                        placeholder="type your answer..."
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <Button type="submit" size="lg" className="w-full">submit test</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader className="text-center">
                                    <CardTitle className="text-4xl">test complete!</CardTitle>
                                    <CardDescription>here&rsquo;s how you did</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-6xl font-bold mb-4">{score}%</p>
                                    <p className="text-muted-foreground mb-8">you correctly answered {Math.round(score / 100 * questions.length)} out of {questions.length} questions.</p>
                                    <Button onClick={handleRetake} size="lg">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        retake test
                                    </Button>
                                    
                                    <div className="mt-8 text-left space-y-4">
                                        <h3 className="text-xl font-bold text-center">review your answers</h3>
                                        {questions.map((q, i) => {
                                            const userAnswer = userAnswers[q.id];
                                            let isCorrect = false;
                                            if (q.type === 'multiple-choice' || q.type === 'written') {
                                                isCorrect = typeof userAnswer === 'string' && userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
                                            } else if (q.type === 'true-false') {
                                                 isCorrect = userAnswer === q.answer;
                                            }
                                            
                                            return (
                                                <div key={q.id} className={cn("p-3 rounded-md", isCorrect ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                                                    <p className="font-semibold">{i+1}. {q.prompt}</p>
                                                    <div className="flex items-center mt-2">
                                                      {isCorrect ? <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />}
                                                      <div>
                                                          <p className="text-sm">your answer: <span className="font-medium">{String(userAnswer)}</span></p>
                                                          {!isCorrect && <p className="text-sm">correct answer: <span className="font-medium">{String(q.answer)}</span></p>}
                                                      </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

    