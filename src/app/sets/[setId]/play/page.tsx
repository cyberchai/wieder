
"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/providers/auth-provider';
import { getFlashcardSet, type FlashcardSet, type Card as CardType } from '@/services/flashcard-sets';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWindowSize } from '@/hooks/use-window-size';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


interface FallingWord {
    id: string;
    word: string;
    definition: string;
    y: number;
    x: number;
}

export default function PlayPage() {
    const params = useParams();
    const setId = params.setId as string;
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const gameAreaRef = useRef<HTMLDivElement>(null);


    const [set, setSet] = useState<FlashcardSet | null>(null);
    const [loading, setLoading] = useState(true);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
    const [shuffledCards, setShuffledCards] = useState<CardType[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [fallingWord, setFallingWord] = useState<FallingWord | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [ignoreNonAlphanumeric, setIgnoreNonAlphanumeric] = useState(false);
    const wordRef = useRef<HTMLDivElement>(null);

    const shuffleCards = useCallback((cards: CardType[]) => {
        if (!cards || cards.length === 0) return [];
        
        let gameCards = [...cards];
        
        const cardsToRepeat = [...cards].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * cards.length));
        gameCards.push(...cardsToRepeat);
        
        return gameCards.sort(() => Math.random() - 0.5);
    }, []);

    useEffect(() => {
        const fetchSet = async () => {
            setLoading(true);
            const fetchedSet = await getFlashcardSet(setId);
            if (fetchedSet) {
                 if (!fetchedSet.shared && fetchedSet.userId !== user?.uid) {
                    toast({ title: "Error", description: "You don't have permission to view this set.", variant: "destructive" });
                    return router.push('/dashboard');
                }
                setSet(fetchedSet);
            } else {
                toast({ title: "Error", description: "Set not found.", variant: "destructive" });
                router.push('/dashboard');
            }
            setLoading(false);
        };
        if (setId && user) fetchSet();
    }, [setId, user, router, toast]);


    const spawnNewWord = useCallback(() => {
        if (currentCardIndex >= shuffledCards.length) {
            setGameState('gameover');
            setFallingWord(null);
            return;
        }

        const card = shuffledCards[currentCardIndex];
        const gameAreaWidth = gameAreaRef.current?.offsetWidth ?? 500;
        const wordWidth = wordRef.current?.offsetWidth ?? 150; // Use previous word's width or an estimate
        const padding = 20; // Add some extra padding to be safe
        const randomX = Math.random() * Math.max(0, gameAreaWidth - wordWidth - padding);

        setFallingWord({
            id: card.id,
            word: card.front,
            definition: card.back,
            y: 0,
            x: randomX,
        });
        setCurrentCardIndex(prev => prev + 1);

    }, [currentCardIndex, shuffledCards]);


     useEffect(() => {
        let animationFrameId: number;

        if (gameState === 'playing' && fallingWord) {
            const gameLoop = () => {
                setFallingWord(prev => {
                    if (!prev) return null;
                    const newY = prev.y + 1; // Adjust speed here
                    
                    const gameAreaHeight = gameAreaRef.current?.offsetHeight ?? 600;

                    if (newY > gameAreaHeight) {
                        setLives(l => l - 1);
                        if (lives - 1 <= 0) {
                            setGameState('gameover');
                             return null;
                        }
                        spawnNewWord();
                        return null;
                    }
                    return { ...prev, y: newY };
                });
                animationFrameId = requestAnimationFrame(gameLoop);
            };
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [gameState, fallingWord, lives, spawnNewWord]);

    const cleanString = (str: string) => {
        return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fallingWord || gameState !== 'playing') return;

        const userAnswer = ignoreNonAlphanumeric ? cleanString(inputValue) : inputValue.trim().toLowerCase();
        const correctAnswer = ignoreNonAlphanumeric ? cleanString(fallingWord.definition) : fallingWord.definition.trim().toLowerCase();

        if (userAnswer === correctAnswer) {
            setScore(s => s + 10);
            setInputValue('');
            toast({ title: "correct!", className: "bg-green-100 dark:bg-green-900/50" });
            spawnNewWord();
        } else {
             toast({ title: "incorrect.", description: `the correct answer was: ${fallingWord.definition}`, variant: "destructive" });
        }
    }

    const startGame = () => {
        setScore(0);
        setLives(3);
        const newShuffledCards = shuffleCards(set?.cards || []);
        setShuffledCards(newShuffledCards);
        setCurrentCardIndex(0);
        setFallingWord(null); 
        setInputValue('');
        
        setTimeout(() => {
            setGameState('playing');
            if (newShuffledCards.length > 0) {
                 const card = newShuffledCards[0];
                 const gameAreaWidth = gameAreaRef.current?.offsetWidth ?? 500;
                 const randomX = Math.random() * (gameAreaWidth - 150); // Initial safe guess
                 setFallingWord({
                    id: card.id,
                    word: card.front,
                    definition: card.back,
                    y: 0,
                    x: randomX,
                 });
                 setCurrentCardIndex(1);
            } else {
                setGameState('gameover');
            }
        }, 100); 
    };

    const restartGame = () => {
        setGameState('idle');
        setFallingWord(null);
        setInputValue('');
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
        )
    }
    
    if (!set) {
        return (
            <ProtectedRoute>
                 <div className="flex flex-col min-h-screen bg-secondary/50">
                    <Header />
                    <main className="flex-1 container py-8 text-center">
                        <p>loading set...</p>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                 <main className="flex-1 container py-8 flex flex-col">
                    <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <Button variant="ghost" asChild>
                                <Link href="/dashboard">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    back to dashboard
                                </Link>
                            </Button>
                            <div className="text-right">
                                 <h1 className="text-2xl font-bold">{set.title}</h1>
                                 <p className="text-muted-foreground">falling words game</p>
                            </div>
                        </div>

                        <div
                            className="flex-grow w-full border-2 rounded-lg p-4 relative overflow-hidden flex items-center justify-center"
                            ref={gameAreaRef}
                            style={{ minHeight: '60vh' }}
                        >
                            {gameState === 'idle' && (
                            <div className="text-center flex flex-col items-center justify-center h-full">
                            <h2 className="text-3xl font-bold mb-4">get ready!</h2>
                            <p className="text-muted-foreground mb-6">
                                type the definition before the word hits the bottom.
                            </p>
                            <div className="flex items-center justify-center space-x-2 mb-6">
                                <Switch
                                id="ignore-chars-mode"
                                checked={ignoreNonAlphanumeric}
                                onCheckedChange={setIgnoreNonAlphanumeric}
                                />
                                <Label htmlFor="ignore-chars-mode" className="cursor-pointer">
                                ignore special characters
                                </Label>
                            </div>
                            <Button onClick={startGame} size="lg">
                                start game
                            </Button>
                            </div>
                        )}

                        {gameState === 'gameover' && (
                            <div className="text-center flex flex-col items-center justify-center h-full">
                            <h2 className="text-3xl font-bold mb-4">game over!</h2>
                            <p className="text-xl text-muted-foreground mb-6">
                                your final score: {score}
                            </p>
                            <Button onClick={restartGame} size="lg">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                play again
                            </Button>
                            </div>
                        )}

                        {gameState === 'playing' && (
                            <>
                            <div className="w-full flex justify-between items-center absolute top-4 px-4">
                                <p className="text-lg font-bold">score: {score}</p>
                                <p className="text-lg font-bold">lives: {'❤️'.repeat(lives)}</p>
                            </div>

                            {fallingWord && (
                                <div
                                ref={wordRef}
                                className="absolute bg-card text-card-foreground py-2 px-4 rounded-md shadow-lg"
                                style={{ top: `${fallingWord.y}px`, left: `${fallingWord.x}px` }}
                                >
                                <p className="text-xl font-semibold">{fallingWord.word}</p>
                                </div>
                            )}

                            <form
                                onSubmit={handleSubmit}
                                className="w-full max-w-md absolute bottom-4 left-1/2 -translate-x-1/2"
                            >
                                <Input
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder="type the definition..."
                                className="text-center text-lg p-4"
                                autoFocus
                                />
                            </form>
                            </>
                        )}
                        </div>

                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
