"use client"

import { useState, useEffect } from "react";
import { ProtectedRoute, useAuth } from "@/providers/auth-provider";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreVertical, Loader2, Trash2, Edit, Share2, Copy } from "lucide-react";
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
import { getFlashcardSets, deleteFlashcardSet, type FlashcardSet } from "@/services/flashcard-sets";
import { useToast } from "@/hooks/use-toast";

const DashboardPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [sets, setSets] = useState<FlashcardSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
    
    const handleShare = (setId: string) => {
        const shareLink = `${window.location.origin}/sets/${setId}/study`;
        navigator.clipboard.writeText(shareLink);
        toast({ title: "Copied to clipboard!", description: "Share link has been copied." });
    };

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
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">My Sets</h1>
                             {user && <p className="text-muted-foreground">hi {user.displayName || user.email}</p>}
                        </div>
                        <Button asChild>
                            <Link href="/sets/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Set
                            </Link>
                        </Button>
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
                                                    <DropdownMenuItem onClick={() => handleShare(set.id)}>
                                                        <Share2 className="mr-2 h-4 w-4" />Share
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
                                            <Link href={`/sets/${set.id}/study`}>Study</Link>
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
