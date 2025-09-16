"use client"

import { useState, useEffect, useMemo, useRef } from "react";
import { ProtectedRoute, useAuth } from "@/providers/auth-provider";
import Header from "@/components/header";
import AuroraBackground from "@/components/aurora-background";
import DashboardParticlesBackground from "@/components/dashboard-particles-background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MoreVertical, Loader2, Trash2, Edit, Share2, Copy, Link as LinkIcon, CopyPlus, Gamepad2, Users, FileText, UserX, Search, BookOpen, Globe, Users2, Tag, Filter, X, Play } from "lucide-react";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useSettings } from "@/hooks/use-settings";
import { trackUserEngagement, trackPageView } from "@/lib/analytics";
import { CacheMonitor } from "@/components/cache-monitor";
import { FlashcardSet } from "@/services/flashcard-sets";

// Import React Query hooks
import {
  useUserFlashcardSets,
  usePublicFlashcardSets,
  useSharedFlashcardSets,
  useGroupFlashcardSets,
  useDeleteFlashcardSet,
  useUpdateFlashcardSet,
  useDuplicateFlashcardSet,
  useDuplicatePublicSet,
  useFlashcardSet,
  useJoinSharedSet,
  useLeaveSharedSet,
  useJoinGroupSet,
  useLeaveGroupSet,
} from "@/hooks/use-flashcard-queries";

const DashboardPageWithReactQuery = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [joinSetId, setJoinSetId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("my-sets");
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
    const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
    const [tagFilterInput, setTagFilterInput] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { handleNavigationClick, enableSounds } = useSoundEffects();
    const { settings } = useSettings();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; setId: string } | null>(null);

    // React Query hooks - these handle caching automatically!
    const { 
        data: userSets = [], 
        isLoading: loadingUserSets, 
        error: userSetsError 
    } = useUserFlashcardSets();
    
    const { 
        data: publicSets = [], 
        isLoading: loadingPublicSets, 
        error: publicSetsError 
    } = usePublicFlashcardSets();
    
    const { 
        data: sharedSets = [], 
        isLoading: loadingSharedSets 
    } = useSharedFlashcardSets();
    
    const { 
        data: groupSets = [], 
        isLoading: loadingGroupSets 
    } = useGroupFlashcardSets();

    // Mutations
    const deleteSetMutation = useDeleteFlashcardSet();
    const updateSetMutation = useUpdateFlashcardSet();
    const duplicateSetMutation = useDuplicateFlashcardSet();
    const duplicatePublicSetMutation = useDuplicatePublicSet();
    const joinSharedSetMutation = useJoinSharedSet();
    const leaveSharedSetMutation = useLeaveSharedSet();
    const joinGroupSetMutation = useJoinGroupSet();
    const leaveGroupSetMutation = useLeaveGroupSet();

    // Tag filter functions
    const handleTagFilter = (tag: string | null) => {
        setSelectedTagFilter(tag);
        setIsTagFilterOpen(false);
        setTagFilterInput("");
    };

    const clearTagFilter = () => {
        setSelectedTagFilter(null);
        setTagFilterInput("");
    };

    const handleTagInputChange = (value: string) => {
        setTagFilterInput(value);
    };

    // Track page view
    useEffect(() => {
        if (user) {
            trackPageView('dashboard', user.uid);
        }
    }, [user]);

    // Filtered sets based on search query
    const filteredUserSets = useMemo(() => {
        if (!searchQuery.trim()) return userSets;
        
        const query = searchQuery.toLowerCase().trim();
        
        return userSets.filter(set => {
            // First, search in set title
            if (set.title.toLowerCase().includes(query)) {
                return true;
            }
            
            // Then, search in tags
            if (Array.isArray(set.tags) && set.tags.some(tag => 
                tag.toLowerCase().includes(query)
            )) {
                return true;
            }
            
            // Finally, search in card keys and values
            return Array.isArray(set.cards) && set.cards.some(card => 
                card.front.toLowerCase().includes(query) || 
                card.back.toLowerCase().includes(query)
            );
        });
    }, [userSets, searchQuery]);

    // Filtered shared sets based on search query
    const filteredSharedSets = useMemo(() => {
        if (!searchQuery.trim()) return sharedSets;
        
        const query = searchQuery.toLowerCase().trim();
        
        return sharedSets.filter(set => {
            // First, search in set title
            if (set.title.toLowerCase().includes(query)) {
                return true;
            }
            
            // Then, search in tags
            if (Array.isArray(set.tags) && set.tags.some(tag => 
                tag.toLowerCase().includes(query)
            )) {
                return true;
            }
            
            // Finally, search in card keys and values
            return Array.isArray(set.cards) && set.cards.some(card => 
                card.front.toLowerCase().includes(query) || 
                card.back.toLowerCase().includes(query)
            );
        });
    }, [sharedSets, searchQuery]);

    // Get all unique tags from public sets
    const availableTags = useMemo(() => {
        const tagSet = new Set<string>();
        publicSets.forEach(set => {
            if (Array.isArray(set.tags)) {
                set.tags.forEach(tag => tagSet.add(tag));
            }
        });
        return Array.from(tagSet).sort();
    }, [publicSets]);

    // Filter tags based on input
    const filteredTags = useMemo(() => {
        if (!tagFilterInput.trim()) return availableTags;
        return availableTags.filter(tag => 
            tag.toLowerCase().includes(tagFilterInput.toLowerCase())
        );
    }, [availableTags, tagFilterInput]);

    // Filtered public sets based on search query and tag filter
    const filteredPublicSets = useMemo(() => {
        let filtered = publicSets;
        
        // Apply tag filter first
        if (selectedTagFilter) {
            filtered = filtered.filter(set => 
                Array.isArray(set.tags) && set.tags.includes(selectedTagFilter)
            );
        }
        
        // Then apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(set => {
                // First, search in set title
                if (set.title.toLowerCase().includes(query)) {
                    return true;
                }
                
                // Then, search in tags
                if (Array.isArray(set.tags) && set.tags.some(tag => 
                    tag.toLowerCase().includes(query)
                )) {
                    return true;
                }
                
                // Finally, search in card keys and values
                return Array.isArray(set.cards) && set.cards.some(card => 
                    card.front.toLowerCase().includes(query) || 
                    card.back.toLowerCase().includes(query)
                );
            });
        }
        
        return filtered;
    }, [publicSets, searchQuery, selectedTagFilter]);

    // Combined my sets and shared sets for the "my sets" tab
    const allMySets = useMemo(() => {
        return [...filteredUserSets, ...filteredSharedSets];
    }, [filteredUserSets, filteredSharedSets]);

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

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(null);
        };

        if (contextMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu]);
    
    const handleDeleteClick = (setId: string) => {
        setDeletingId(setId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deletingId) {
            try {
                await deleteSetMutation.mutateAsync(deletingId);
                // Track deletion
                if (user) {
                    trackUserEngagement('delete_flashcard_set', { 
                        set_id: deletingId,
                        action: 'delete'
                    }, user.uid);
                }
            } catch (error) {
                // Error handling is done in the mutation
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
          // Track sharing
          if (user) {
              trackUserEngagement('share_flashcard_set', { 
                  set_id: set.id,
                  set_title: set.title,
                  action: 'share'
              }, user.uid);
          }
          toast({ title: "Copied to clipboard!", description: "Share link has been copied." });
        } catch (error) {
          toast({ title: "Error", description: "Could not copy share link.", variant: "destructive" });
        }
    };

    const handleCopyId = (setId: string) => {
        navigator.clipboard.writeText(setId);
        // Track copying ID
        if (user) {
            trackUserEngagement('copy_set_id', { 
                set_id: setId,
                action: 'copy_id'
            }, user.uid);
        }
        toast({ title: "Copied!", description: "Set ID has been copied to your clipboard." });
    };

    const handleDuplicate = async (set: FlashcardSet) => {
        if (!user) return;
        try {
            await duplicateSetMutation.mutateAsync(set);
            // Track duplication
            trackUserEngagement('duplicate_flashcard_set', { 
                set_id: set.id,
                set_title: set.title,
                action: 'duplicate'
            }, user.uid);
        } catch (error) {
            // Error handling is done in the mutation
        }
    }

    const handleDuplicatePublicSet = async (publicSet: FlashcardSet) => {
        if (!user) return;
        try {
            await duplicatePublicSetMutation.mutateAsync(publicSet);
            // Track duplication
            trackUserEngagement('duplicate_public_set', { 
                set_id: publicSet.id,
                set_title: publicSet.title,
                action: 'duplicate'
            }, user.uid);
        } catch (error) {
            // Error handling is done in the mutation
        }
    }

    const handleContextMenu = (e: React.MouseEvent, setId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            setId
        });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleDuplicateFromContextMenu = async () => {
        if (!contextMenu || !user) return;
        const publicSet = publicSets.find(set => set.id === contextMenu.setId);
        if (publicSet) {
            await handleDuplicatePublicSet(publicSet);
        }
        setContextMenu(null);
    };

    const handleJoinSet = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = joinSetId.trim();
        if (trimmedId) {
            try {
                // Use React Query to fetch the set
                const { getFlashcardSet } = await import('@/services/flashcard-sets');
                const set = await getFlashcardSet(trimmedId);
                if (set && (set.shared || set.isPublic)) {
                    // Use Firebase mutation instead of localStorage
                    await joinSharedSetMutation.mutateAsync(trimmedId);
                    router.push(`/sets/${trimmedId}/study`);
                } else {
                     toast({ title: "Error", description: "Set not found or is not accessible.", variant: "destructive" });
                }
            } catch(error) {
                toast({ title: "Error", description: "Could not find the set.", variant: "destructive" });
            }
        }
    }

    const handleTabChange = (value: string) => {
        enableSounds(); // Enable sounds on first user interaction
        handleNavigationClick(); // Play navigation sound
        setActiveTab(value);
    };

    const handleTogglePublic = async (set: FlashcardSet) => {
        if (!user) return;
        
        try {
            const newPublicStatus = !set.isPublic;
            await updateSetMutation.mutateAsync({ 
                setId: set.id, 
                updates: { isPublic: newPublicStatus } 
            });
        } catch (error) {
            // Error handling is done in the mutation
        }
    };

    const handleRemoveSharedSet = (setIdToRemove: string) => {
        leaveSharedSetMutation.mutate(setIdToRemove);
    };

    const handleRemoveGroupSet = (setIdToRemove: string) => {
        leaveGroupSetMutation.mutate(setIdToRemove);
    };

    // Show loading state
    if (loadingUserSets) {
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
                                {`${(user.displayName || user.email)?.toLowerCase()}'s big brain operation`}
                            </h1>
                            <p className="text-muted-foreground">
                                <b>{new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}&rsquo;s grind</b>
                            </p>
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
                                        {`found ${filteredUserSets.length + filteredSharedSets.length + filteredPublicSets.length} result${
                                            filteredUserSets.length + filteredSharedSets.length + filteredPublicSets.length !== 1 ? "s" : ""
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
                    
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="my-sets" className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                My Sets
                                <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    {allMySets.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="group-sets" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Group Sets
                                <span className="ml-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                    {groupSets.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="public-sets" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Public Sets
                                <span className="ml-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                    {publicSets.length}
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
                                                {filteredUserSets.length} result{filteredUserSets.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </h3>
                                    {filteredUserSets.length > 0 ? (
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {filteredUserSets.map(set => (
                                                <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                    <Card className="flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 ease-in-out cursor-pointer transform">
                                                        <CardHeader>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <CardTitle className="pr-4">{set.title}</CardTitle>
                                                                    {set.isPublic && (
                                                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block mt-1">
                                                                            public
                                                                        </span>
                                                                    )}
                                                                </div>
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
                                                                       {/* Study & Edit Actions */}
                                                                       <DropdownMenuItem asChild>
                                                                           <Link href={`/sets/${set.id}/edit`}>
                                                                               <Edit className="mr-2 h-4 w-4" />
                                                                               Edit
                                                                           </Link>
                                                                       </DropdownMenuItem>
                                                                       
                                                                       {/* Sharing & Visibility */}
                                                                       <DropdownMenuItem
                                                                           onClick={(e) => {
                                                                               e.preventDefault();
                                                                               e.stopPropagation();
                                                                               handleTogglePublic(set);
                                                                           }}
                                                                       >
                                                                           {set.isPublic ? (
                                                                               <>
                                                                                   <Users className="mr-2 h-4 w-4" />
                                                                                   Make private
                                                                               </>
                                                                           ) : (
                                                                               <>
                                                                                   <Globe className="mr-2 h-4 w-4" />
                                                                                   Make public
                                                                               </>
                                                                           )}
                                                                       </DropdownMenuItem>
                                                                       
                                                                       <DropdownMenuItem
                                                                           onClick={(e) => {
                                                                               e.preventDefault();
                                                                               e.stopPropagation();
                                                                               handleShare(set);
                                                                           }}
                                                                       >
                                                                           <Share2 className="mr-2 h-4 w-4" />
                                                                           Share
                                                                       </DropdownMenuItem>
                                                                       
                                                                       <DropdownMenuItem
                                                                           onClick={(e) => {
                                                                               e.preventDefault();
                                                                               e.stopPropagation();
                                                                               handleCopyId(set.id);
                                                                           }}
                                                                       >
                                                                           <Copy className="mr-2 h-4 w-4" />
                                                                           Copy set ID
                                                                       </DropdownMenuItem>
                                                                       
                                                                       {/* Management Actions */}
                                                                       <DropdownMenuItem
                                                                           onClick={(e) => {
                                                                               e.preventDefault();
                                                                               e.stopPropagation();
                                                                               handleDuplicate(set);
                                                                           }}
                                                                       >
                                                                           <CopyPlus className="mr-2 h-4 w-4" />
                                                                           Duplicate
                                                                       </DropdownMenuItem>
                                                                       
                                                                       <DropdownMenuItem
                                                                           onClick={(e) => {
                                                                               e.preventDefault();
                                                                               e.stopPropagation();
                                                                               handleDeleteClick(set.id);
                                                                           }}
                                                                           className="text-destructive"
                                                                       >
                                                                           <Trash2 className="mr-2 h-4 w-4" />
                                                                           Delete
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
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="group-sets">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold tracking-tight">group sets</h2>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setIsJoinDialogOpen(true)}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        join by set ID
                                    </Button>
                                </div>
                                
                                {loadingGroupSets ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Card key={i} className="p-6">
                                                <Skeleton className="h-4 w-3/4 mb-2" />
                                                <Skeleton className="h-3 w-1/2 mb-4" />
                                                <Skeleton className="h-8 w-full" />
                                            </Card>
                                        ))}
                                    </div>
                                ) : groupSets.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No group sets yet</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Join group sets by entering a set ID or link below.
                                        </p>
                                        <Button onClick={() => setIsJoinDialogOpen(true)}>
                                            <Users className="mr-2 h-4 w-4" />
                                            Join a Group Set
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {groupSets.map((set) => (
                                            <Card key={set.id} className="flex flex-col hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <CardTitle className="text-lg mb-2 line-clamp-2">
                                                                {set.title}
                                                            </CardTitle>
                                                            <CardDescription className="mb-2">
                                                                {set.cards.length} cards
                                                            </CardDescription>
                                                            {set.creatorDisplayName && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    by {set.creatorDisplayName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                
                                                <CardFooter className="flex flex-col gap-2 pt-0">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => {
                                                            handleNavigationClick();
                                                            router.push(`/sets/${set.id}/edit`);
                                                        }}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Collab
                                                    </Button>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            className="flex-1"
                                                            onClick={() => {
                                                                handleNavigationClick();
                                                                router.push(`/sets/${set.id}/study`);
                                                            }}
                                                        >
                                                            <Play className="mr-2 h-4 w-4" />
                                                            Study
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => handleRemoveGroupSet(set.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="public-sets">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold tracking-tight">public sets</h2>
                                    <div className="flex items-center gap-2">
                                        {selectedTagFilter && (
                                            <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                                <Tag className="h-3 w-3" />
                                                {selectedTagFilter}
                                                <button
                                                    onClick={clearTagFilter}
                                                    className="hover:bg-primary/20 rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                        <Popover open={isTagFilterOpen} onOpenChange={setIsTagFilterOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Filter className="mr-2 h-4 w-4" />
                                                    {selectedTagFilter ? 'filter by tag' : 'browse all'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-0" align="end">
                                                <div className="p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">Filter by tag</Label>
                                                        {selectedTagFilter && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={clearTagFilter}
                                                                className="h-6 px-2 text-xs"
                                                            >
                                                                Clear
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Separator />
                                                    
                                                    {/* Text input for filtering tags */}
                                                    <div className="space-y-2">
                                                        <Input
                                                            placeholder="Search tags..."
                                                            value={tagFilterInput}
                                                            onChange={(e) => handleTagInputChange(e.target.value)}
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    
                                                    {/* Tag options with proper spacing for hover animations */}
                                                    <div className="space-y-1 max-h-48 overflow-y-auto -mx-2 px-2">
                                                        <Button
                                                            variant={selectedTagFilter === null ? "default" : "ghost"}
                                                            size="sm"
                                                            className="w-full justify-start text-xs hover:bg-muted/80 transition-colors rounded-md"
                                                            onClick={() => handleTagFilter(null)}
                                                        >
                                                            All sets
                                                        </Button>
                                                        {filteredTags.length > 0 ? (
                                                            filteredTags.map((tag) => (
                                                                <Button
                                                                    key={tag}
                                                                    variant={selectedTagFilter === tag ? "default" : "ghost"}
                                                                    size="sm"
                                                                    className="w-full justify-start text-xs hover:bg-muted/80 transition-colors rounded-md"
                                                                    onClick={() => handleTagFilter(tag)}
                                                                >
                                                                    <Tag className="mr-2 h-3 w-3" />
                                                                    {tag}
                                                                </Button>
                                                            ))
                                                        ) : (
                                                            <div className="text-xs text-muted-foreground text-center py-2">
                                                                No tags found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                 
                                {loadingPublicSets ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>loading public sets...</span>
                                    </div>
                                ) : filteredPublicSets.length > 0 ? (
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {filteredPublicSets.map(set => (
                                            <div key={set.id} className="relative">
                                                <Link href={`/sets/${set.id}/study`} className="block">
                                                    <Card 
                                                        className="flex flex-col hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 ease-in-out cursor-pointer transform"
                                                        onContextMenu={(e) => handleContextMenu(e, set.id)}
                                                    >
                                                        <CardHeader>
                                                            <div className="space-y-2">
                                                                <div className="flex items-start justify-between">
                                                                    <CardTitle className="pr-4">{set.title}</CardTitle>
                                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                        public
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                                                        by {set.creatorDisplayName || "some user on this app"}
                                                                    </span>
                                                                </div>
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
                                            </div>
                                        ))}
                                    </div>
                                ) : searchQuery ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
                                        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">no public sets found</h3>
                                        <p className="text-muted-foreground mb-4">
                                            try adjusting your search terms
                                        </p>
                                        <Button 
                                            variant="outline"
                                            onClick={() => setSearchQuery("")}
                                        >
                                            clear search
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
                                        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">no public sets yet</h3>
                                        <p className="text-muted-foreground mb-4">
                                            be the first to make your sets public for the community to discover
                                        </p>
                                        <Button 
                                            variant="outline"
                                            onClick={() => setActiveTab("my-sets")}
                                        >
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            create a set
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
                <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 sm:px-6 lg:px-8 border-t mt-auto relative z-10">
                    <div className="container mx-auto flex flex-col gap-2 sm:flex-row items-center justify-between">
                        <p className="text-xs text-muted-foreground"><a href="https://chairaharder.com" target="_blank" rel="noopener noreferrer" className="hover:underline">best served with yerba mate</a></p>
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

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-popover border rounded-md shadow-lg py-1 min-w-[160px] context-menu"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                        onClick={handleDuplicateFromContextMenu}
                    >
                        <CopyPlus className="h-4 w-4" />
                        Duplicate
                    </button>
                </div>
            )}

            {/* Cache Monitor - only in development */}
            <CacheMonitor />
        </ProtectedRoute>
    )
}

export default DashboardPageWithReactQuery;
