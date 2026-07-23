"use client"

import { useState, useEffect, useMemo, useRef } from "react";
import { ProtectedRoute, useAuth } from "@/providers/auth-provider";
import Header from "@/components/header";
import AuroraBackground from "@/components/aurora-background";
import DashboardParticlesBackground from "@/components/dashboard-particles-background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreVertical, Loader2, Trash2, Edit, Share2, Copy, Link as LinkIcon, CopyPlus, Users, UserX, Search, BookOpen, Globe, Tag, Filter, X, Target, Coins, Flame, Crown, Clock, Lock, Grid3x3, Zap, CloudRain, Grid2x2, Eye, EyeOff, LayoutGrid, List } from "lucide-react";
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
import { getFlashcardSet, type FlashcardSet } from "@/services/flashcard-sets";
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
import { SilentCircleHider } from "@/components/silent-element-hider";
import { AnimatedSetCard } from "@/components/animated-set-card";
import { StatCard } from "@/components/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GameModeCard } from "@/components/game-mode-card";
import { Trophy, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useUserFlashcardSets,
  usePublicFlashcardSets,
  useSharedFlashcardSets,
  useGroupFlashcardSets,
  useDeleteFlashcardSet,
  useUpdateFlashcardSet,
  useDuplicateFlashcardSet,
  useDuplicatePublicSet,
  useJoinSharedSet,
  useLeaveSharedSet,
  useJoinGroupSet,
  useLeaveGroupSet,
} from "@/hooks/use-flashcard-queries";
import { useUserStats, useUserRank, useLeaderboard, useUserSetsProgress } from "@/hooks/use-stats-queries";
import { calculateProgressPercentage } from "@/services/set-progress";
import { useQuery } from "@tanstack/react-query";
import { getUserProfilesBatch } from "@/services/users";


const DashboardPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    // React Query hooks - these handle all the state and loading for you!
    const { 
        data: sets = [], 
        isLoading: loading, 
        error: userSetsError 
    } = useUserFlashcardSets();
    
    const { 
        data: publicSets = [], 
        isLoading: loadingPublic, 
        error: publicSetsError 
    } = usePublicFlashcardSets();
    
    const { 
        data: sharedSets = [], 
        isLoading: loadingShared 
    } = useSharedFlashcardSets();
    
    const { 
        data: groupSets = [], 
        isLoading: loadingGroup 
    } = useGroupFlashcardSets();
    
    // Stats hooks
    const { 
        data: userStats,
        isLoading: loadingStats
    } = useUserStats();
    
    const {
        data: userRank
    } = useUserRank();
    
    const {
        data: leaderboard = []
    } = useLeaderboard();
    
    // Fetch user profiles for top 3 leaderboard display
    const top3Uids = useMemo(() => leaderboard.slice(0, 3).map(stat => stat.uid), [leaderboard]);
    const { data: leaderboardProfiles = new Map() } = useQuery({
        queryKey: ['leaderboard-profiles-top3', top3Uids],
        queryFn: () => getUserProfilesBatch(top3Uids),
        enabled: top3Uids.length > 0,
        staleTime: 5 * 60 * 1000,
    });
    
    // Collect all set IDs for progress tracking
    const allSetIds = useMemo(() => {
        const ids = new Set<string>();
        sets.forEach(set => ids.add(set.id));
        publicSets.forEach(set => ids.add(set.id));
        groupSets.forEach(set => ids.add(set.id));
        return Array.from(ids);
    }, [sets, publicSets, groupSets]);
    
    // Fetch progress for all sets
    const { data: setsProgress = new Map() } = useUserSetsProgress(allSetIds);
    
    // Helper function to get progress percentage for a set
    const getSetProgress = (set: FlashcardSet): number => {
        const progress = setsProgress.get(set.id);
        const cardCount = Array.isArray(set.cards) ? set.cards.length : 0;
        if (!progress || cardCount === 0) return 0;
        return calculateProgressPercentage(progress.studiedCardIds, cardCount);
    };
    
    // UI state variables
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
    const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => {
        // Initialize from localStorage if available
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dashboard-view-mode');
            if (saved === 'list' || saved === 'cards') {
                return saved;
            }
        }
        return 'cards';
    });

    // Persist view mode to localStorage
    useEffect(() => {
        localStorage.setItem('dashboard-view-mode', viewMode);
    }, [viewMode]);

    // Calculate stats
    const totalCards = useMemo(() => {
        return [...sets, ...sharedSets, ...groupSets].reduce((sum, set) => sum + (Array.isArray(set.cards) ? set.cards.length : 0), 0);
    }, [sets, sharedSets, groupSets]);

    // Use real stats from Firestore
    const totalWieds = userStats?.wieds || 0;
    const cardsStudied = userStats?.cardsStudied || 0;
    const studyStreak = userStats?.studyStreak ?? 1; // Default to 1, not 0
    const leaderboardRank = userRank || null;

    // Game modes
    const gameModes = [
        {
            title: "Crossword",
            description: "Solve crossword puzzles using your flashcard knowledge",
            icon: Grid3x3,
            color: "bg-indigo-500",
            players: "1-2 players",
        },
        {
            title: "Speed",
            description: "Race against the clock to answer as many cards as possible",
            icon: Zap,
            color: "bg-orange-500",
            players: "1-8 players",
        },
        {
            title: "Raining Words",
            description: "Catch falling words and match them before they hit the ground",
            icon: CloudRain,
            color: "bg-blue-500",
            players: "1-4 players",
        },
        {
            title: "Match Pairs",
            description: "Match terms with their definitions in this memory challenge",
            icon: Grid2x2,
            color: "bg-emerald-500",
            players: "1 player",
        },
    ];

    // React Query mutations
    const deleteSetMutation = useDeleteFlashcardSet();
    const updateSetMutation = useUpdateFlashcardSet();
    const joinSharedSetMutation = useJoinSharedSet();
    const leaveSharedSetMutation = useLeaveSharedSet();
    const joinGroupSetMutation = useJoinGroupSet();
    const leaveGroupSetMutation = useLeaveGroupSet();
    const duplicateSetMutation = useDuplicateFlashcardSet();
    const duplicatePublicSetMutation = useDuplicatePublicSet();

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
    const filteredSets = useMemo(() => {
        if (!searchQuery.trim()) return sets;
        
        const query = searchQuery.toLowerCase().trim();
        
        return sets.filter(set => {
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
        return [...filteredSets, ...filteredSharedSets];
    }, [filteredSets, filteredSharedSets]);

    // Group sets are now loaded via React Query hook useGroupFlashcardSets

    // React Query handles all the data fetching automatically!
    // No need for the big useEffect blocks anymore 🎉

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
                // Toast is handled automatically by the mutation hook
            } catch (error) {
                // Error handling is done in the mutation hook
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
            // Toast is handled automatically by the mutation hook
        } catch (error) {
            // Error handling is done in the mutation hook
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
            // Toast is handled automatically by the mutation hook
        } catch (error) {
            // Error handling is done in the mutation hook
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

    const handleJoinGroupSet = async (input: string) => {
        if (!input.trim()) return;
        
        try {
            // Parse the input - could be a set ID or a full URL
            let setId = input.trim();
            
            // If it's a URL, extract the set ID
            if (setId.includes('/sets/') && setId.includes('/study')) {
                const urlMatch = setId.match(/\/sets\/([^\/]+)\/study/);
                if (urlMatch) {
                    setId = urlMatch[1];
                }
            }
            
            // Validate the set ID format (should be alphanumeric)
            if (!/^[a-zA-Z0-9]+$/.test(setId)) {
                toast({ title: "Invalid format", description: "Please enter a valid set ID or link.", variant: "destructive" });
                return;
            }
            
            // Check if set already exists in group sets
            if (groupSets.find(set => set.id === setId)) {
                toast({ title: "Already joined", description: "You've already joined this set.", variant: "destructive" });
                return;
            }
            
            // Fetch the set
            const set = await getFlashcardSet(setId);
            if (set) {
                // Use Firebase mutation instead of localStorage
                await joinGroupSetMutation.mutateAsync(setId);
                setJoinSetId("");
                setIsJoinDialogOpen(false);
            } else {
                toast({ title: "Set not found", description: "Could not find a set with that ID.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to join the set. Please check the ID and try again.", variant: "destructive" });
        }
    }

    const handleRemoveGroupSet = (setIdToRemove: string) => {
        leaveGroupSetMutation.mutate(setIdToRemove);
    };

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
            // Cache is automatically updated, toast is handled by mutation
        } catch (error) {
            // Error handling is done in the mutation hook
        }
    };

    const handleRemoveSharedSet = (setIdToRemove: string) => {
        leaveSharedSetMutation.mutate(setIdToRemove);
    };


    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex flex-col min-h-screen bg-secondary/15 relative">
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
            <div className="flex flex-col min-h-screen bg-secondary/15 relative">
                <AuroraBackground />
                <DashboardParticlesBackground />
                <Header 
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchInputRef={searchInputRef}
                />
                <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
                    {/* Welcome Message */}
                    <div className="mb-8">
                        {user && (() => {
                            // Extract first name from displayName or email
                            const firstName = user.displayName 
                                ? user.displayName.split(' ')[0] 
                                : user.email?.split('@')[0] || "there";
                            return (
                                <h2 className="text-2xl font-semibold mb-1">
                                    Hi {firstName}, let&apos;s get stacked
                                </h2>
                            );
                        })()}
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Cards Studied"
                            value={loadingStats ? "..." : cardsStudied.toLocaleString()}
                            icon={Target}
                            trend={{ 
                                value: totalCards > 0 
                                    ? `${Math.round((cardsStudied / totalCards) * 100)}% of ${totalCards.toLocaleString()} cards`
                                    : `${totalCards.toLocaleString()} cards available`,
                                isPositive: true 
                            }}
                            color="bg-blue-500"
                            backTitle="Suggested Set"
                            backContent={
                                (() => {
                                    const allSets = [...sets, ...sharedSets, ...groupSets];
                                    const funReasons = [
                                        "it's been lonely lately",
                                        "your brain will thank you",
                                        "knowledge is power",
                                        "you're on a roll today",
                                        "it misses you"
                                    ];
                                    if (allSets.length === 0) {
                                        return <p className="text-xs text-muted-foreground">Create a set to get started!</p>;
                                    }
                                    const randomSet = allSets[Math.floor(Math.random() * allSets.length)];
                                    const randomReason = funReasons[Math.floor(Math.random() * funReasons.length)];
                                    return (
                                        <div className="space-y-2">
                                            <Link href={`/sets/${randomSet.id}/study`} className="block">
                                                <p className="text-sm font-medium text-primary hover:underline truncate">{randomSet.title}</p>
                                            </Link>
                                            <p className="text-xs text-muted-foreground italic">because {randomReason}</p>
                                        </div>
                                    );
                                })()
                            }
                        />
                        <StatCard
                            title="Wieds"
                            value={loadingStats ? "..." : totalWieds.toLocaleString()}
                            icon={Coins}
                            trend={{ value: "1 per card, 100 per game", isPositive: true }}
                            color="bg-green-500"
                            backContent={
                                <div className="relative h-full w-full overflow-hidden rounded-md">
                                    {/* Mini Garden Scene */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-300">
                                        {/* Sun */}
                                        <div className="absolute top-1 right-2 w-6 h-6 bg-yellow-400 rounded-full shadow-lg" />
                                        {/* Cloud */}
                                        <div className="absolute top-2 left-2 flex">
                                            <div className="w-4 h-4 bg-white rounded-full" />
                                            <div className="w-5 h-5 bg-white rounded-full -ml-2 -mt-1" />
                                            <div className="w-3 h-3 bg-white rounded-full -ml-1" />
                                        </div>
                                        {/* Grass/Ground */}
                                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-green-500 rounded-t-full" />
                                        <div className="absolute bottom-1 left-2 w-6 h-6 bg-green-600 rounded-full" />
                                        <div className="absolute bottom-0 right-3 w-5 h-5 bg-green-600 rounded-full" />
                                        {/* Trees */}
                                        <div className="absolute bottom-6 left-4 w-4 h-4 bg-green-700 rounded-full" />
                                        <div className="absolute bottom-5 left-5 w-0.5 h-3 bg-amber-700" />
                                        <div className="absolute bottom-6 right-6 w-5 h-5 bg-green-700 rounded-full" />
                                        <div className="absolute bottom-5 right-7 w-0.5 h-3 bg-amber-700" />
                                        {/* Flower */}
                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                                            <div className="w-2 h-2 bg-pink-400 rounded-full" />
                                            <div className="w-0.5 h-2 bg-green-600 mx-auto" />
                                        </div>
                                    </div>
                                    {/* Text overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5">
                                        <p className="text-[9px] text-white text-center font-medium">Spend Wieds unlocking new themes</p>
                                    </div>
                                </div>
                            }
                        />
                        <StatCard
                            title="Study Streak"
                            value={loadingStats ? "..." : studyStreak.toString()}
                            icon={Flame}
                            trend={{ value: studyStreak > 0 ? "Keep it up!" : "Start studying!", isPositive: studyStreak > 0 }}
                            color="bg-orange-500"
                            backTitle="Recent Activity"
                            backContent={
                                <div className="space-y-2 text-xs">
                                    {sets.slice(0, 3).map((set, i) => (
                                        <div key={set.id} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                            <span className="truncate">Studied {set.title}</span>
                                        </div>
                                    ))}
                                    {sets.length === 0 && (
                                        <p className="text-muted-foreground">No recent activity yet</p>
                                    )}
                                </div>
                            }
                        />
                        <StatCard
                            title="Leaderboard Rank"
                            value={loadingStats || !leaderboardRank ? "..." : `#${leaderboardRank}`}
                            icon={Crown}
                            trend={{ value: leaderboardRank ? `Top ${Math.ceil((leaderboardRank / (leaderboard.length || 1)) * 100)}%` : "No rank yet", isPositive: leaderboardRank ? leaderboardRank <= 20 : false }}
                            color="bg-purple-500"
                            backTitle="Top 3"
                            backContent={
                                <div className="space-y-2">
                                    {leaderboard.slice(0, 3).map((stat, index) => {
                                        const profile = leaderboardProfiles.get(stat.uid);
                                        const displayName = profile?.displayName || "Anonymous";
                                        const rankIcon = index === 0 ? <Crown className="h-3 w-3 text-yellow-500" /> :
                                                        index === 1 ? <Trophy className="h-3 w-3 text-gray-400" /> :
                                                        <Medal className="h-3 w-3 text-amber-600" />;
                                        const scoreColor = index === 0 ? "text-yellow-500" :
                                                          index === 1 ? "text-slate-400" :
                                                          "text-amber-600";
                                        return (
                                            <div key={stat.uid} className="flex items-center gap-2">
                                                {rankIcon}
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={profile?.photoURL} />
                                                    <AvatarFallback className="text-[8px]">{displayName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs truncate flex-1">{stat.uid === user?.uid ? "You" : displayName}</span>
                                                <span className={`font-cherry-bomb text-base ${scoreColor}`}>{stat.wieds}</span>
                                            </div>
                                        );
                                    })}
                                    {leaderboard.length === 0 && (
                                        <p className="text-xs text-muted-foreground">No rankings yet</p>
                                    )}
                                </div>
                            }
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Decks and Games Section */}
                        <div>
                            <Card className="p-6 mb-6">
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <TabsList>
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
                                        <div className="flex gap-2 items-center">
                                            {/* View Mode Toggle */}
                                            <div className="flex border rounded-md">
                                                <Button
                                                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                                                    size="icon"
                                                    className="h-9 w-9 rounded-r-none"
                                                    onClick={() => setViewMode('cards')}
                                                    title="Card view"
                                                >
                                                    <LayoutGrid className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                                    size="icon"
                                                    className="h-9 w-9 rounded-l-none"
                                                    onClick={() => setViewMode('list')}
                                                    title="List view"
                                                >
                                                    <List className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Button 
                                                variant="outline"
                                                onClick={() => setIsJoinDialogOpen(true)}
                                            >
                                                <LinkIcon className="mr-2 h-4 w-4"/>join set
                                            </Button>
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
                                        <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Search className="h-4 w-4 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">
                                                        {`found ${filteredSets.length + filteredSharedSets.length + filteredPublicSets.length} result${
                                                            filteredSets.length + filteredSharedSets.length + filteredPublicSets.length !== 1 ? "s" : ""
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
                                        <div className={viewMode === 'cards' ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-2"}>
                                            {filteredSets.map(set => {
                                                const cardCount = Array.isArray(set.cards) ? set.cards.length : 0;
                                                const progress = getSetProgress(set);
                                                const category = Array.isArray(set.tags) && set.tags.length > 0 ? set.tags[0] : "General";
                                                
                                                // List view
                                                if (viewMode === 'list') {
                                                    return (
                                                        <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                            <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                                                                            {set.title}
                                                                        </span>
                                                                        {!set.isPublic && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                                                                        <Badge variant="secondary" className="text-xs">{category}</Badge>
                                                                        <span className="hidden sm:inline">{cardCount} cards</span>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-7 w-7"
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
                                                                                    <Link href={`/sets/${set.id}/edit`}>
                                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                                        Edit
                                                                                    </Link>
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTogglePublic(set); }}>
                                                                                    {set.isPublic ? <><Users className="mr-2 h-4 w-4" />Make private</> : <><Globe className="mr-2 h-4 w-4" />Make public</>}
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(set); }}>
                                                                                    <Share2 className="mr-2 h-4 w-4" />Share
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyId(set.id); }}>
                                                                                    <Copy className="mr-2 h-4 w-4" />Copy set ID
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDuplicate(set); }}>
                                                                                    <CopyPlus className="mr-2 h-4 w-4" />Duplicate
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(set.id); }} className="text-destructive">
                                                                                    <Trash2 className="mr-2 h-4 w-4" />Delete
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        </Link>
                                                    );
                                                }
                                                
                                                // Card view (default)
                                                return (
                                                    <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                                                            <div className="flex justify-between items-start mb-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                                        {set.title}
                                                                    </h3>
                                                                    {!set.isPublic && <Lock className="w-4 h-4 text-muted-foreground" />}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-3">
                                                                    {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                                                                </p>
                                                                <Badge variant="secondary">{category}</Badge>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
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
                                                                        <Link href={`/sets/${set.id}/edit`}>
                                                                            <Edit className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </Link>
                                                                    </DropdownMenuItem>
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

                                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                <span>{cardCount} cards</span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4">
                                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                                <span>Progress</span>
                                                                <span>{progress}%</span>
                                                            </div>
                                                            <div className="w-full bg-muted rounded-full h-2">
                                                                <div
                                                                    className="bg-primary h-2 rounded-full transition-all"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </Card>
                                                    </Link>
                                                );
                                            })}
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
                                 
                                 {loadingPublic ? (
                                     <div className="flex items-center gap-2 text-muted-foreground">
                                         <Loader2 className="h-5 w-5 animate-spin" />
                                         <span>loading public sets...</span>
                                     </div>
                                ) : filteredPublicSets.length > 0 ? (
                                    <div className={viewMode === 'cards' ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-2"}>
                                        {filteredPublicSets.map(set => {
                                            const cardCount = Array.isArray(set.cards) ? set.cards.length : 0;
                                            const progress = getSetProgress(set);
                                            const category = Array.isArray(set.tags) && set.tags.length > 0 ? set.tags[0] : "General";
                                            
                                            // List view
                                            if (viewMode === 'list') {
                                                return (
                                                    <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                        <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <Globe className="h-4 w-4 text-sky-500 flex-shrink-0" />
                                                                    <span className="font-medium truncate group-hover:text-primary transition-colors">
                                                                        {set.title}
                                                                    </span>
                                                                    <span className="text-xs font-medium bg-sky-500/15 text-sky-500 px-2 py-0.5 rounded-full flex-shrink-0">
                                                                        public
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                                                                    <Badge variant="secondary" className="text-xs bg-violet-500/15 text-violet-500 border-transparent hover:bg-violet-500/25">{category}</Badge>
                                                                    <span className="hidden sm:inline">
                                                                        <span className="font-semibold text-card-foreground/75">{cardCount}</span> cards
                                                                    </span>
                                                                    <span className="hidden md:inline text-xs truncate max-w-[100px]">
                                                                        by {set.creatorDisplayName || "someone"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    </Link>
                                                );
                                            }
                                            
                                            // Card view (default)
                                            return (
                                                <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                    <Card 
                                                        className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                                                        onContextMenu={(e) => handleContextMenu(e, set.id)}
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                                    {set.title}
                                                                </h3>
                                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                    public
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-3">
                                                                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                                                            </p>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant="secondary">{category}</Badge>
                                                                <span className="text-xs text-muted-foreground">
                                                                    by {set.creatorDisplayName || "some user on this app"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span>{cardCount} cards</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                            <span>Progress</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-muted rounded-full h-2">
                                                            <div
                                                                className="bg-primary h-2 rounded-full transition-all"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Button 
                                                            className="w-full"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                router.push(`/sets/${set.id}/study`);
                                                            }}
                                                        >
                                                            <BookOpen className="mr-2 h-4 w-4" />
                                                            Study
                                                        </Button>
                                                    </div>
                                                </Card>
                                                </Link>
                                            );
                                        })}
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
                                 
                                 {loadingGroup ? (
                                     <div className="flex items-center gap-2 text-muted-foreground">
                                         <Loader2 className="h-5 w-5 animate-spin" />
                                         <span>loading group sets...</span>
                                     </div>
                                ) : groupSets.length > 0 ? (
                                    <div className={viewMode === 'cards' ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-2"}>
                                        {groupSets.map(set => {
                                            const cardCount = Array.isArray(set.cards) ? set.cards.length : 0;
                                            const progress = getSetProgress(set);
                                            const category = Array.isArray(set.tags) && set.tags.length > 0 ? set.tags[0] : "General";
                                            
                                            // List view
                                            if (viewMode === 'list') {
                                                return (
                                                    <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                        <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer group">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                    <span className="font-medium truncate group-hover:text-primary transition-colors">
                                                                        {set.title}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                                                                    <Badge variant="secondary" className="text-xs">{category}</Badge>
                                                                    <span className="hidden sm:inline">{cardCount} cards</span>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.preventDefault()}>
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                                            <DropdownMenuItem asChild>
                                                                                <Link href={`/sets/${set.id}/edit`}><Edit className="mr-2 h-4 w-4" />edit set</Link>
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyId(set.id); }}>
                                                                                <Copy className="mr-2 h-4 w-4" />copy set ID
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDuplicate(set); }}>
                                                                                <CopyPlus className="mr-2 h-4 w-4" />duplicate set
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveGroupSet(set.id); }} className="text-destructive">
                                                                                <UserX className="mr-2 h-4 w-4" />remove from group sets
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    </Link>
                                                );
                                            }
                                            
                                            // Card view (default)
                                            return (
                                                <Link key={set.id} href={`/sets/${set.id}/study`} className="block">
                                                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                                                        <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                                                    {set.title}
                                                                </h3>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mb-3">
                                                                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                                                            </p>
                                                            <Badge variant="secondary">{category}</Badge>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8"
                                                                    onClick={(e) => e.preventDefault()}
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/sets/${set.id}/edit`}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        edit set
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleCopyId(set.id);
                                                                    }}
                                                                >
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    copy set ID
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleDuplicate(set);
                                                                    }}
                                                                >
                                                                    <CopyPlus className="mr-2 h-4 w-4" />
                                                                    duplicate set
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem 
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleRemoveGroupSet(set.id);
                                                                    }} 
                                                                    className="text-destructive"
                                                                >
                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                    remove from group sets
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                            <span>{cardCount} cards</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                            <span>Progress</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="w-full bg-muted rounded-full h-2">
                                                            <div
                                                                className="bg-primary h-2 rounded-full transition-all"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            className="flex-1"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                router.push(`/sets/${set.id}/edit`);
                                                            }}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Collab
                                                        </Button>
                                                        <Button 
                                                            className="flex-1"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                router.push(`/sets/${set.id}/study`);
                                                            }}
                                                        >
                                                            <BookOpen className="mr-2 h-4 w-4" />
                                                            Study
                                                        </Button>
                                                    </div>
                                                </Card>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                 ) : (
                                     <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card">
                                         <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                         <h3 className="text-lg font-semibold mb-2">no group sets yet</h3>
                                         <p className="text-muted-foreground mb-4">
                                             join sets by entering a set ID or sharing link
                                         </p>
                                         <Button 
                                             variant="outline"
                                             onClick={() => setIsJoinDialogOpen(true)}
                                         >
                                             <Users className="mr-2 h-4 w-4" />
                                             join by set ID
                                         </Button>
                                     </div>
                                 )}
                             </div>
                         </TabsContent>
                                </Tabs>
                            </Card>

                            {/* Game Modes Section */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Game Modes</h2>
                                        <p className="text-sm text-foreground/70">
                                            Challenge yourself or play with friends
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {gameModes.map((game) => {
                                        // Combine all available sets for selection
                                        const allAvailableSets = [...sets, ...sharedSets, ...groupSets];
                                        
                                        return (
                                            <GameModeCard 
                                                key={game.title} 
                                                {...game}
                                                sets={allAvailableSets}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
                <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 sm:px-6 lg:px-8 mt-auto relative z-10 bg-gradient-to-b from-transparent to-black/25">
                    <div className="container mx-auto flex flex-col gap-2 sm:flex-row items-center justify-between">
                        {/* <p className="text-xs text-muted-foreground">made with &lt;3</p> */}
                        <p className="text-xs text-foreground"><a href="https://chairaharder.com" target="_blank" rel="noopener noreferrer" className="hover:underline">best served with yerba mate</a></p>
                        <nav className="flex gap-4 sm:gap-6">
                        <Link href="/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                            terms of service
                        </Link>
                        <Link href="/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                            privacy
                        </Link>
                        <Link href="/contribute" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                            contribute
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

            <AlertDialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>join set</AlertDialogTitle>
                  <AlertDialogDescription>
                    enter a set ID (e.g., dBa9EfTgiwk9lQMTrl38) or a full link (e.g., http://localhost:9002/sets/dBa9EfTgiwk9lQMTrl38/study)
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="set ID or link"
                    value={joinSetId}
                    onChange={(e) => setJoinSetId(e.target.value)}
                    className="w-full"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleJoinGroupSet(joinSetId)}>
                    join
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

            {/* Hide unwanted circle elements */}
            <SilentCircleHider />
        </ProtectedRoute>
    )
}

export default DashboardPage;