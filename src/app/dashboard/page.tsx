"use client"

import { useState, useEffect, useMemo, useRef } from "react";
import { ProtectedRoute, useAuth } from "@/providers/auth-provider";
import Header from "@/components/header";
import AuroraBackground from "@/components/aurora-background";
import DashboardParticlesBackground from "@/components/dashboard-particles-background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreVertical, Loader2, Trash2, Edit, Share2, Copy, Link as LinkIcon, CopyPlus, Gamepad2, Users, FileText, UserX, Search, BookOpen, Globe, Users2 } from "lucide-react";
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
import { getFlashcardSets, deleteFlashcardSet, updateFlashcardSet, duplicateFlashcardSet, getFlashcardSet, type FlashcardSet } from "@/services/flashcard-sets";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const DashboardPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [sets, setSets] = useState<FlashcardSet[]>([]);
    const [sharedSets, setSharedSets] = useState<FlashcardSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [joinSetId, setJoinSetId] = useState("");
    const [loadingShared, setLoadingShared] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("my-sets");
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filtered sets based on search query
    const filteredSets = useMemo(() => {
        if (!searchQuery.trim()) return sets;
        
        const query = searchQuery.toLowerCase().trim();
        
        return sets.filter(set => {
            // First, search in set title
            if (set.title.toLowerCase().includes(query)) {
                return true;
            }
            
            // Then, search in card keys and values
            return Array.isArray(set.cards) && set.cards.some(card => 
                card.front.toLowerCase().includes(query) || 
                card.back.toLowerCase().includes(query)
            );
        });
    }, [sets, searchQuery]);

    // Filtered shared sets based on search query
    const filteredSharedSets = useMemo(() => {
        if (!searchQuery.trim()) return sharedSets;
        
        const query = searchQuery.toLowerCase().trim();
        
        return sharedSets.filter(set => {
            // First, search in set title
            if (set.title.toLowerCase().includes(query)) {
                return true;
            }
            
            // Then, search in card keys and values
            return Array.isArray(set.cards) && set.cards.some(card => 
                card.front.toLowerCase().includes(query) || 
                card.back.toLowerCase().includes(query)
            );
        });
    }, [sharedSets, searchQuery]);

    // Combined my sets and shared sets for the "my sets" tab
    const allMySets = useMemo(() => {
        return [...filteredSets, ...filteredSharedSets];
    }, [filteredSets, filteredSharedSets]);

    useEffect(() => {
        if (user) {
            const unsubscribe = getFlashcardSets(
                user.uid,
                (data) => {
                    setSets(data);
                    setLoading(false);
                },
                (error) => {
                    console.error("Failed to load flashcard sets", error);
                    // Best-effort error surface; common cases are permission-denied or missing index
                    const code = (error as any)?.code as string | undefined;
                    let description = "Failed to load your sets.";
                    if (code === "permission-denied") {
                        description = "permission denied: check Firestore rules.";
                    } else if (code === "failed-precondition") {
                        description = "missing required index: create the suggested Firestore index.";
                    }
                    toast({ title: "Error", description, variant: "destructive" });
                    setLoading(false);
                }
            );

            // Fetch shared sets from local storage
            const joinedSetIds = JSON.parse(localStorage.getItem('joinedSetIds') || '[]');
            if (joinedSetIds.length > 0) {
                const fetchSharedSets = async () => {
                    const fetchedSets: FlashcardSet[] = [];
                    for (const setId of joinedSetIds) {
                        try {
                            const set = await getFlashcardSet(setId);
                            if (set) {
                                fetchedSets.push(set);
                            }
                        } catch (error) {
                            console.error(`Failed to fetch shared set ${setId}`, error);
                        }
                    }
                    setSharedSets(fetchedSets);
                    setLoadingShared(false);
                };
                fetchSharedSets();
            } else {
                setLoadingShared(false);
            }

            return () => unsubscribe();
        }
    }, [user]);

    // Keyboard shortcut to focus search (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
    
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
          const shareLink = `${window.location.origin}/sets/${set.id}/study`;
          navigator.clipboard.writeText(shareLink);
          toast({ title: "Copied to clipboard!", description: "Share link has been copied." });
        } catch (error) {
          toast({ title: "Error", description: "Could not copy share link.", variant: "destructive" });
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

    const handleJoinSet = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = joinSetId.trim();
        if (trimmedId) {
            try {
                const set = await getFlashcardSet(trimmedId);
                if (set && set.shared) {
                    const joinedSetIds = JSON.parse(localStorage.getItem('joinedSetIds') || '[]');
                    if (!joinedSetIds.includes(trimmedId)) {
                        joinedSetIds.push(trimmedId);
                        localStorage.setItem('joinedSetIds', JSON.stringify(joinedSetIds));
                        
                        setSharedSets(prev => {
                            const newSharedSets = [...prev];
                            if(!newSharedSets.find(s => s.id === set.id)) {
                                newSharedSets.push(set);
                            }
                            return newSharedSets;
                        });
                    }
                    router.push(`/sets/${trimmedId}/study`);
                } else {
                     toast({ title: "Error", description: "Set not found or is not shared.", variant: "destructive" });
                }
            } catch(error) {
                toast({ title: "Error", description: "Could not find the set.", variant: "destructive" });
            }
        }
    }

    const handleRemoveSharedSet = (setIdToRemove: string) => {
        const joinedSetIds = JSON.parse(localStorage.getItem('joinedSetIds') || '[]');
        const updatedIds = joinedSetIds.filter((id: string) => id !== setIdToRemove);
        localStorage.setItem('joinedSetIds', JSON.stringify(updatedIds));
        setSharedSets(prev => prev.filter(set => set.id !== setIdToRemove));
        toast({ title: "Set removed", description: "The shared set has been removed from your dashboard." });
    };


    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex flex-col min-h-screen bg-secondary/50 relative">
                    <AuroraBackground />
                    <DashboardParticlesBackground />
                    <Header 
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      searchInputRef={searchInputRef}
                    />
                <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 text-center relative z-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mt-12" />
                    <p className="text-muted-foreground mt-2">loading your sets...</p>
                </main>
                </div>
            </ProtectedRoute>
        );
    }
    
    return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen bg-secondary/50 relative">
                <AuroraBackground />
                <DashboardParticlesBackground />
                <Header 
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchInputRef={searchInputRef}
                />
                <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                        <div>
                        {user && (
                            <>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {`${user.displayName || user.email}'s big brain operation`}
                            </h1>
                            <p className="text-muted-foreground">welcome back!</p>
                            </>
                        )}
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
                                            <Button className="hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out transform" type="submit">join</Button>
                                        </div>
                                    </form>
                                </PopoverContent>
                            </Popover>
                            <Button className="hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out transform" asChild>
                                <Link href="/sets/create">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    new set
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Search Results Summary */}
                    {searchQuery && (
                        <div className="mb-8 p-4 bg-muted/50 rounded-lg border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        {`found ${filteredSets.length + filteredSharedSets.length} result${
                                            filteredSets.length + filteredSharedSets.length !== 1 ? "s" : ""
                                        } for "${searchQuery}"`}
                                    </p>

                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs hover:shadow-md hover:scale-105 transition-all duration-200 ease-in-out transform"
                                    onClick={() => setSearchQuery("")}
                                >
                                    clear search
                                </Button>
                            </div>
                        </div>
                    )}
                    
                                         <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                         <TabsList className="grid w-full grid-cols-3">
                             <TabsTrigger value="my-sets" className="flex items-center gap-2">
                                 <BookOpen className="h-4 w-4" />
                                 My Sets
                                 <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                     {allMySets.length}
                                 </span>
                             </TabsTrigger>
                             <TabsTrigger value="class-sets" className="flex items-center gap-2">
                                 <Users className="h-4 w-4" />
                                 Class Sets
                                 <span className="ml-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                     0
                                 </span>
                             </TabsTrigger>
                             <TabsTrigger value="public-sets" className="flex items-center gap-2">
                                 <Globe className="h-4 w-4" />
                                 Public Sets
                                 <span className="ml-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                     ∞
                                 </span>
                             </TabsTrigger>
                         </TabsList>
                            <TabsContent value="my-sets">
                             <div className="space-y-8">
                                 {/* Personal Sets Section */}
                                 <div>
                                     <h3 className="text-xl font-semibold mb-4 flex items-center justify-between">
                                         <div className="flex items-center gap-2">
                                             <BookOpen className="h-5 w-5" />
                                             personal sets
                                         </div>
                                         {searchQuery && (
                                             <span className="text-sm text-muted-foreground">
                                                 {filteredSets.length} result{filteredSets.length !== 1 ? 's' : ''}
                                             </span>
                                         )}
                                     </h3>
                                     {filteredSets.length > 0 ? (
                                         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                             {filteredSets.map(set => (
                                                 <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                     <Card className="flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 ease-in-out cursor-pointer transform">
                                                         <CardHeader>
                                                             <div className="flex items-start justify-between">
                                                                 <CardTitle className="pr-4">{set.title}</CardTitle>
                                                                 <DropdownMenu>
                                                                 <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 ..."
                                                                        onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        }}
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>

                                                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                                         <DropdownMenuItem asChild>
                                                                             <Link href={`/sets/${set.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
                                                                         </DropdownMenuItem>
                                                                         <DropdownMenuItem
                                                                            onSelect={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleDuplicate(set);
                                                                            }}
                                                                            >
                                                                            <CopyPlus className="mr-2 h-4 w-4" />Duplicate
                                                                            </DropdownMenuItem>

                                                                            <DropdownMenuItem
                                                                            onSelect={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleShare(set);
                                                                            }}
                                                                            >
                                                                            <Share2 className="mr-2 h-4 w-4" />Share
                                                                            </DropdownMenuItem>

                                                                            <DropdownMenuItem
                                                                            onSelect={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleCopyId(set.id);
                                                                            }}
                                                                            >
                                                                            <Copy className="mr-2 h-4 w-4" />copy setID
                                                                         </DropdownMenuItem>
                                                                         <DropdownMenuItem
                                                                            onSelect={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleDeleteClick(set.id);
                                                                            }}
                                                                            >
                                                                            <Trash2 className="mr-2 h-4 w-4" />Delete
                                                                         </DropdownMenuItem>
                                                                     </DropdownMenuContent>
                                                                 </DropdownMenu>
                                                             </div>
                                                             <CardDescription>{Array.isArray(set.cards) ? set.cards.length : 0} cards</CardDescription>
                                                             {searchQuery && (
                                                                 <div className="text-xs text-muted-foreground">
                                                                     {set.title.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                                                                         <span>matches title</span>
                                                                     ) : (
                                                                         <span>matches {Array.isArray(set.cards) ? set.cards.filter(card => 
                                                                             card.front.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                                             card.back.toLowerCase().includes(searchQuery.toLowerCase())
                                                                         ).length : 0} cards</span>
                                                                     )}
                                                                 </div>
                                                             )}
                                                         </CardHeader>
                                                         <CardContent className="flex-grow"></CardContent>
                                                         <CardFooter className="flex flex-col gap-2">
                                                             <Button className="w-full hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out transform" onClick={() => router.push(`/sets/${set.id}/study`)}>
                                                                 <BookOpen className="mr-2 h-4 w-4" />
                                                                 Study
                                                             </Button>
                                                         </CardFooter>
                                                     </Card>
                                                 </Link>
                                             ))}
                                         </div>
                                     ) : searchQuery ? (
                                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-card">
                                             <h4 className="text-lg font-semibold mb-2">no personal sets found</h4>
                                             <p className="text-muted-foreground mb-4">try adjusting your search terms or create a new set.</p>
                                             <Button className="hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out transform" asChild>
                                                 <Link href="/sets/create">
                                                     <PlusCircle className="mr-2 h-4 w-4" />
                                                     create a set
                                                 </Link>
                                             </Button>
                                         </div>
                                     ) : (
                                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-card">
                                            <h4 className="text-lg font-semibold mb-2">no personal sets yet!</h4>
                                             <p className="text-muted-foreground mb-4">get started by creating your first flashcard set.</p>
                                             <Button className="hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out transform" asChild>
                                                 <Link href="/sets/create">
                                                     <PlusCircle className="mr-2 h-4 w-4" />
                                                     create a set
                                                 </Link>
                                             </Button>
                                         </div>
                                     )}
                                 </div>

                                 {/* Shared Sets Section */}
                                 <div>
                                     <h3 className="text-xl font-semibold mb-4 flex items-center justify-between">
                                         <div className="flex items-center gap-2">
                                             <Users2 className="h-5 w-5" />
                                             shared with me
                                         </div>
                                         {searchQuery && (
                                             <span className="text-sm text-muted-foreground">
                                                 {filteredSharedSets.length} result{filteredSharedSets.length !== 1 ? 's' : ''}
                                             </span>
                                         )}
                                     </h3>
                                     {loadingShared ? (
                                         <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>loading shared sets...</span>
                                        </div>
                                     ) : filteredSharedSets.length > 0 ? (
                                         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {filteredSharedSets.map(set => (
                                                <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                    <Card className="flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 ease-in-out cursor-pointer transform">
                                                        <CardHeader>
                                                            <div className="flex items-start justify-between">
                                                                <CardTitle className="pr-4">{set.title}</CardTitle>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 hover:shadow-md hover:scale-110 transition-all duration-200 ease-in-out transform" onClick={(e) => e.preventDefault()}>
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleRemoveSharedSet(set.id)} className="text-destructive">
                                                                            <UserX className="mr-2 h-4 w-4" />
                                                                            remove myself from set
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                            <CardDescription>{Array.isArray(set.cards) ? set.cards.length : 0} cards</CardDescription>
                                                            {searchQuery && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {set.title.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                                                                        <span>matches title</span>
                                                                    ) : (
                                                                        <span>matches {Array.isArray(set.cards) ? set.cards.filter(card => 
                                                                            card.front.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                                            card.back.toLowerCase().includes(searchQuery.toLowerCase())
                                                                        ).length : 0} cards</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </CardHeader>
                                                        <CardContent className="flex-grow"></CardContent>
                                                        <CardFooter className="flex flex-col gap-2">
                                                            <Button className="w-full hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out transform" onClick={() => router.push(`/sets/${set.id}/study`)}>
                                                                <BookOpen className="mr-2 h-4 w-4" />
                                                                Study
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                </Link>
                                            ))}
                                        </div>
                                     ) : searchQuery ? (
                                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-card">
                                           <h4 className="text-lg font-semibold mb-2">no shared sets found</h4>
                                            <p className="text-muted-foreground">try adjusting your search terms.</p>
                                        </div>
                                     ) : (
                                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-card">
                                           <h4 className="text-lg font-semibold mb-2">no shared sets</h4>
                                            <p className="text-muted-foreground">sets you join using an ID will appear here.</p>
                                        </div>
                                     )}
                                 </div>
                             </div>
                         </TabsContent>
                                                 <TabsContent value="class-sets">
                             <div className="space-y-6">
                                 <div className="flex items-center justify-between">
                                     <h2 className="text-2xl font-bold tracking-tight">class sets</h2>
                                     <Button variant="outline" size="sm">
                                         <Users className="mr-2 h-4 w-4" />
                                         join class
                                     </Button>
                                 </div>
                                 
                                 <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
                                     <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                     <h3 className="text-lg font-semibold mb-2">no class sets yet</h3>
                                     <p className="text-muted-foreground mb-4">
                                         join a class to access shared flashcard sets from your teachers and classmates
                                     </p>
                                     <div className="flex gap-2 justify-center">
                                         <Button variant="outline">
                                             <Users className="mr-2 h-4 w-4" />
                                             join with class code
                                         </Button>
                                         <Button variant="outline">
                                             <Search className="mr-2 h-4 w-4" />
                                             browse classes
                                         </Button>
                                     </div>
                                 </div>
                             </div>
                         </TabsContent>
                         
                         <TabsContent value="public-sets">
                             <div className="space-y-6">
                                 <div className="flex items-center justify-between">
                                     <h2 className="text-2xl font-bold tracking-tight">public sets</h2>
                                     <Button variant="outline" size="sm">
                                         <Globe className="mr-2 h-4 w-4" />
                                         browse all
                                     </Button>
                                 </div>
                                 
                                 <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
                                     <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                     <h3 className="text-lg font-semibold mb-2">explore public sets</h3>
                                     <p className="text-muted-foreground mb-4">
                                         discover and join public flashcard sets created by the community
                                     </p>
                                     <div className="flex gap-2 justify-center">
                                         <Button variant="outline">
                                             <Search className="mr-2 h-4 w-4" />
                                             search public sets
                                         </Button>
                                         <Button variant="outline">
                                             <BookOpen className="mr-2 h-4 w-4" />
                                             popular subjects
                                         </Button>
                                     </div>
                                 </div>
                             </div>
                         </TabsContent>
                    </Tabs>
                </main>
                <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 sm:px-6 lg:px-8 border-t mt-auto relative z-10">
                    <div className="container mx-auto flex flex-col gap-2 sm:flex-row items-center justify-between">
                        <p className="text-xs text-muted-foreground">made with &lt;3</p>
                        <nav className="flex gap-4 sm:gap-6">
                        <Link href="/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                            terms of service
                        </Link>
                        <Link href="/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                            privacy
                        </Link>
                        </nav>
                    </div>
                </footer>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    this action cannot be undone. this will permanently delete your flashcard set.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                    delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </ProtectedRoute>
    )
}

export default DashboardPage;
