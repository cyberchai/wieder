"use client"

import { useState, useEffect } from "react";
import { ProtectedRoute, useAuth } from "@/providers/auth-provider";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreVertical, Loader2, Trash2, Edit, Share2, Copy, Link as LinkIcon, CopyPlus } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getFlashcardSets, deleteFlashcardSet, updateFlashcardSet, duplicateFlashcardSet, type FlashcardSet } from "@/services/flashcard-sets";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

const DashboardPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [sets, setSets] = useState<FlashcardSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [joinSetId, setJoinSetId] = useState("");

    useEffect(() => {
        if (user) {
            const unsubscribe = getFlashcardSets(user.uid, (data) => {
                setSets(data);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user]);
    
    const handleDeleteClick = (setId: string) => {
        setDeletingId(setId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deletingId) {
            try {
                await deleteFlashcardSet(deletingId);
                toast({ title: "Success", description: "Set deleted successfully." });
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete set.", variant: "destructive" });
            } finally {
                setIsDeleteDialogOpen(false);
                setDeletingId(null);
            }
        }
    };
    
    const handleShare = async (set: FlashcardSet) => {
        try {
          if (!set.shared) {
            await updateFlashcardSet(set.id, set.title, set.cards, true);
          }
          const shareLink = `${window.location.origin}/sets/${set.id}/study`;
          navigator.clipboard.writeText(shareLink);
          toast({ title: "Copied to clipboard!", description: "Share link has been copied." });
        } catch (error) {
          toast({ title: "Error", description: "Could not share set.", variant: "destructive" });
        }
    };

    const handleCopyId = (setId: string) => {
        navigator.clipboard.writeText(setId);
        toast({ title: "Copied!", description: "Set ID has been copied to your clipboard." });
    };

    const handleDuplicate = async (set: FlashcardSet) => {
        if (!user) return;
        try {
            await duplicateFlashcardSet(set);
            toast({ title: "Success", description: "Set duplicated successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to duplicate set.", variant: "destructive" });
        }
    }

    const handleJoinSet = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinSetId.trim()) {
            router.push(`/sets/${joinSetId.trim()}/study`);
        }
    }


    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex flex-col min-h-screen bg-secondary/50">
                    <Header />
                    <main className="flex-1 p-4 md:p-8 container text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-12" />
                        <p className="text-muted-foreground mt-2">Loading your sets...</p>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }
    
    return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-secondary/50">
                <Header />
                <main className="flex-1 p-4 md:p-8 container">
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">my sets</h1>
                             {user && <p className="text-muted-foreground">{`hi ${user.displayName || user.email}`}</p>}
                        </div>
                        <div className="flex gap-2 items-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline"><LinkIcon className="mr-2 h-4 w-4"/>join set</Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <form onSubmit={handleJoinSet} className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">join a shared set</h4>
                                            <p className="text-sm text-muted-foreground">
                                                paste the set id below to practice.
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="join-set-id" className="sr-only">set id</Label>
                                            <Input
                                                id="join-set-id"
                                                placeholder="enter set id"
                                                value={joinSetId}
                                                onChange={(e) => setJoinSetId(e.target.value)}
                                            />
                                            <Button type="submit">join</Button>
                                        </div>
                                    </form>
                                </PopoverContent>
                            </Popover>
                            <Button asChild>
                                <Link href="/sets/create">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    new set
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {sets.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {sets.map(set => (
                                <Card key={set.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="pr-4">{set.title}</CardTitle>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/sets/${set.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDuplicate(set)}>
                                                        <CopyPlus className="mr-2 h-4 w-4" />Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleShare(set)}>
                                                        <Share2 className="mr-2 h-4 w-4" />Share
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleCopyId(set.id)}>
                                                        <Copy className="mr-2 h-4 w-4" />copy setID
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(set.id)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardDescription>{set.cards.length} cards</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow"></CardContent>
                                    <CardFooter>
                                        <Button className="w-full" asChild>
                                            <Link href={`/sets/${set.id}/study`}>practice</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-12 border-2 border-dashed rounded-lg">
                           <h2 className="text-2xl font-semibold mb-2">No sets yet!</h2>
                            <p className="text-muted-foreground mb-4">Get started by creating your first flashcard set.</p>
                            <Button asChild>
                                <Link href="/sets/create">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create a Set
                                </Link>
                            </Button>
                        </div>
                    )}
                </main>
                <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t mt-auto">
                    <p className="text-xs text-muted-foreground">made with &lt;3 by a smithie</p>
                    <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link href="/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                        terms of service
                    </Link>
                    <Link href="/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                        privacy
                    </Link>
                    </nav>
                </footer>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your flashcard set.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </ProtectedRoute>
    )
}

export default DashboardPage;
