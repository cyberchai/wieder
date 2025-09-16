import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getFlashcardSets, 
  getFlashcardSet, 
  getPublicFlashcardSets,
  createFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
  duplicateFlashcardSet,
  duplicatePublicSet,
  type FlashcardSet,
  type Card
} from '@/services/flashcard-sets';
import { 
  getUserProfile, 
  addJoinedSetId, 
  removeJoinedSetId, 
  addJoinedGroupSetId, 
  removeJoinedGroupSetId,
  migrateJoinedSetsToFirebase 
} from '@/services/users';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { trackUserEngagement } from '@/lib/analytics';

// Query keys for consistent caching
export const flashcardQueryKeys = {
  all: ['flashcardSets'] as const,
  userSets: (userId: string) => [...flashcardQueryKeys.all, 'user', userId] as const,
  singleSet: (setId: string) => [...flashcardQueryKeys.all, 'single', setId] as const,
  publicSets: () => [...flashcardQueryKeys.all, 'public'] as const,
  sharedSets: (setIds: string[]) => [...flashcardQueryKeys.all, 'shared', setIds] as const,
};

// Hook to get user's flashcard sets
export const useUserFlashcardSets = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: flashcardQueryKeys.userSets(user?.uid || ''),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Use a direct query instead of the listener-based approach
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const setsCollection = collection(db, "flashcardSets");
      const q = query(
        setsCollection,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const sets: FlashcardSet[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<FlashcardSet>;
        sets.push({
          id: docSnap.id,
          userId: data?.userId ?? "",
          title: data?.title ?? "Untitled",
          cards: Array.isArray(data?.cards) ? data.cards : [],
          createdAt: data?.createdAt || new Date(),
          shared: Boolean(data?.shared),
          isPublic: Boolean(data?.isPublic),
          tags: Array.isArray(data?.tags) ? data.tags : [],
        } as FlashcardSet);
      });
      
      return sets;
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook to get a single flashcard set
export const useFlashcardSet = (setId: string) => {
  return useQuery({
    queryKey: flashcardQueryKeys.singleSet(setId),
    queryFn: () => getFlashcardSet(setId),
    enabled: !!setId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook to get public flashcard sets
export const usePublicFlashcardSets = (pageSize: number = 20) => {
  return useQuery({
    queryKey: flashcardQueryKeys.publicSets(),
    queryFn: () => {
      return new Promise<FlashcardSet[]>((resolve, reject) => {
        const unsubscribe = getPublicFlashcardSets(
          (sets) => {
            unsubscribe();
            resolve(sets);
          },
          (error) => {
            unsubscribe();
            reject(error);
          },
          pageSize
        );
      });
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook to get shared sets (from Firebase)
export const useSharedFlashcardSets = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: flashcardQueryKeys.sharedSets([]), // We'll update this dynamically
    queryFn: async () => {
      if (!user) return [];
      
      // Migrate localStorage data to Firebase on first load
      await migrateJoinedSetsToFirebase(user.uid);
      
      const userProfile = await getUserProfile(user.uid);
      const joinedSetIds = userProfile?.joinedSetIds || [];
      
      if (joinedSetIds.length === 0) return [];
      
      const sets: FlashcardSet[] = [];
      for (const setId of joinedSetIds) {
        try {
          const set = await getFlashcardSet(setId);
          if (set) sets.push(set);
        } catch (error) {
          console.error(`Failed to fetch shared set ${setId}`, error);
        }
      }
      return sets;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook to get group sets (from Firebase)
export const useGroupFlashcardSets = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...flashcardQueryKeys.all, 'group', user?.uid || ''],
    queryFn: async () => {
      if (!user) return [];
      
      // Migrate localStorage data to Firebase on first load
      await migrateJoinedSetsToFirebase(user.uid);
      
      const userProfile = await getUserProfile(user.uid);
      const joinedGroupSetIds = userProfile?.joinedGroupSetIds || [];
      
      if (joinedGroupSetIds.length === 0) return [];
      
      const sets: FlashcardSet[] = [];
      for (const setId of joinedGroupSetIds) {
        try {
          const set = await getFlashcardSet(setId);
          if (set) sets.push(set);
        } catch (error) {
          console.error(`Failed to fetch group set ${setId}`, error);
        }
      }
      return sets;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Mutation to create a new flashcard set
export const useCreateFlashcardSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      title, 
      cards, 
      tags 
    }: { 
      title: string; 
      cards: Omit<Card, 'id'>[]; 
      tags?: string[] 
    }) => {
      if (!user) throw new Error('User not authenticated');
      return createFlashcardSet(user.uid, title, cards, tags);
    },
    onSuccess: (docRef, variables) => {
      // Invalidate and refetch user sets
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.userSets(user?.uid || '') 
      });
      
      // Track creation
      if (user) {
        trackUserEngagement('create_flashcard_set', {
          set_title: variables.title,
          card_count: variables.cards.length,
          action: 'create'
        }, user.uid);
      }
      
      toast({ 
        title: 'Success!', 
        description: 'Your new set has been created.' 
      });
    },
    onError: (error) => {
      console.error('Failed to create flashcard set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create set. Please try again.', 
        variant: 'destructive' 
      });
    },
  });
};

// Mutation to update a flashcard set
export const useUpdateFlashcardSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      setId, 
      updates 
    }: { 
      setId: string; 
      updates: Partial<Pick<FlashcardSet, 'title' | 'cards' | 'shared' | 'isPublic' | 'tags'>> 
    }) => {
      return updateFlashcardSet(setId, updates);
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.singleSet(variables.setId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.userSets(user?.uid || '') 
      });
      
      // Invalidate group sets to reflect changes
      queryClient.invalidateQueries({ 
        queryKey: [...flashcardQueryKeys.all, 'group', user?.uid || ''] 
      });
      
      // If making public/private, invalidate public sets
      if (variables.updates.isPublic !== undefined) {
        queryClient.invalidateQueries({ 
          queryKey: flashcardQueryKeys.publicSets() 
        });
      }
      
      toast({ 
        title: 'Success', 
        description: 'Set updated successfully.' 
      });
    },
    onError: (error) => {
      console.error('Failed to update flashcard set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update set.', 
        variant: 'destructive' 
      });
    },
  });
};

// Mutation to delete a flashcard set
export const useDeleteFlashcardSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: deleteFlashcardSet,
    onSuccess: (_, setId) => {
      // Remove from cache immediately
      queryClient.removeQueries({ 
        queryKey: flashcardQueryKeys.singleSet(setId) 
      });
      
      // Invalidate user sets
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.userSets(user?.uid || '') 
      });
      
      // Invalidate public sets (in case it was public)
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.publicSets() 
      });
      
      // Track deletion
      if (user) {
        trackUserEngagement('delete_flashcard_set', {
          set_id: setId,
          action: 'delete'
        }, user.uid);
      }
      
      toast({ 
        title: 'Success', 
        description: 'Set deleted successfully.' 
      });
    },
    onError: (error) => {
      console.error('Failed to delete flashcard set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete set.', 
        variant: 'destructive' 
      });
    },
  });
};

// Mutation to duplicate a flashcard set
export const useDuplicateFlashcardSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (set: FlashcardSet) => {
      if (!user) throw new Error('User not authenticated');
      return duplicateFlashcardSet(set, user.uid);
    },
    onSuccess: (_, originalSet) => {
      // Invalidate user sets to show the new duplicate
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.userSets(user?.uid || '') 
      });
      
      // Track duplication
      if (user) {
        trackUserEngagement('duplicate_flashcard_set', {
          set_id: originalSet.id,
          set_title: originalSet.title,
          action: 'duplicate'
        }, user.uid);
      }
      
      toast({ 
        title: 'Success', 
        description: 'Set duplicated successfully.' 
      });
    },
    onError: (error) => {
      console.error('Failed to duplicate flashcard set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to duplicate set.', 
        variant: 'destructive' 
      });
    },
  });
};

// Mutation to duplicate a public set
export const useDuplicatePublicSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (publicSet: FlashcardSet) => {
      if (!user) throw new Error('User not authenticated');
      return duplicatePublicSet(publicSet, user.uid);
    },
    onSuccess: (_, publicSet) => {
      // Invalidate user sets to show the new duplicate
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.userSets(user?.uid || '') 
      });
      
      // Track duplication
      if (user) {
        trackUserEngagement('duplicate_public_set', {
          set_id: publicSet.id,
          set_title: publicSet.title,
          action: 'duplicate'
        }, user.uid);
      }
      
      toast({ 
        title: 'Success', 
        description: 'Public set duplicated to your personal sets.' 
      });
    },
    onError: (error) => {
      console.error('Failed to duplicate public set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to duplicate public set.', 
        variant: 'destructive' 
      });
    },
  });
};

// Optimistic update helper for better UX
export const useOptimisticUpdateFlashcardSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      setId, 
      updates 
    }: { 
      setId: string; 
      updates: Partial<Pick<FlashcardSet, 'title' | 'cards' | 'shared' | 'isPublic' | 'tags'>> 
    }) => {
      return updateFlashcardSet(setId, updates);
    },
    onMutate: async ({ setId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: flashcardQueryKeys.singleSet(setId) 
      });
      
      // Snapshot previous value
      const previousSet = queryClient.getQueryData<FlashcardSet>(
        flashcardQueryKeys.singleSet(setId)
      );
      
      // Optimistically update
      if (previousSet) {
        queryClient.setQueryData<FlashcardSet>(
          flashcardQueryKeys.singleSet(setId),
          { ...previousSet, ...updates }
        );
      }
      
      // Return context with previous value
      return { previousSet };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSet) {
        queryClient.setQueryData(
          flashcardQueryKeys.singleSet(variables.setId),
          context.previousSet
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.singleSet(variables.setId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.userSets(user?.uid || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: [...flashcardQueryKeys.all, 'group', user?.uid || ''] 
      });
    },
  });
};

// Mutation to join a shared set
export const useJoinSharedSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (setId: string) => {
      if (!user) throw new Error('User not authenticated');
      return addJoinedSetId(user.uid, setId);
    },
    onSuccess: (_, setId) => {
      // Invalidate shared sets query
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.sharedSets([]) 
      });
      
      // Track joining set
      if (user) {
        trackUserEngagement('join_flashcard_set', { 
          set_id: setId,
          action: 'join'
        }, user.uid);
      }
      
      toast({ 
        title: 'Success!', 
        description: 'Set joined successfully.' 
      });
    },
    onError: (error) => {
      console.error('Failed to join set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to join set. Please try again.', 
        variant: 'destructive' 
      });
    },
  });
};

// Mutation to leave a shared set
export const useLeaveSharedSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (setId: string) => {
      if (!user) throw new Error('User not authenticated');
      return removeJoinedSetId(user.uid, setId);
    },
    onSuccess: (_, setId) => {
      // Invalidate shared sets query
      queryClient.invalidateQueries({ 
        queryKey: flashcardQueryKeys.sharedSets([]) 
      });
      
      toast({ 
        title: 'Set removed', 
        description: 'The shared set has been removed from your dashboard.' 
      });
    },
    onError: (error) => {
      console.error('Failed to leave set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to leave set. Please try again.', 
        variant: 'destructive' 
      });
    },
  });
};

// Mutation to join a group set
export const useJoinGroupSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (setId: string) => {
      if (!user) throw new Error('User not authenticated');
      return addJoinedGroupSetId(user.uid, setId);
    },
    onSuccess: (_, setId) => {
      // Invalidate group sets query
      queryClient.invalidateQueries({ 
        queryKey: [...flashcardQueryKeys.all, 'group', user?.uid || ''] 
      });
      
      toast({ 
        title: 'Success!', 
        description: 'Group set joined successfully.' 
      });
    },
    onError: (error) => {
      console.error('Failed to join group set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to join group set. Please try again.', 
        variant: 'destructive' 
      });
    },
  });
};

// Mutation to leave a group set
export const useLeaveGroupSet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (setId: string) => {
      if (!user) throw new Error('User not authenticated');
      return removeJoinedGroupSetId(user.uid, setId);
    },
    onSuccess: (_, setId) => {
      // Invalidate group sets query
      queryClient.invalidateQueries({ 
        queryKey: [...flashcardQueryKeys.all, 'group', user?.uid || ''] 
      });
      
      toast({ 
        title: 'Set removed', 
        description: 'The group set has been removed from your dashboard.' 
      });
    },
    onError: (error) => {
      console.error('Failed to leave group set:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to leave group set. Please try again.', 
        variant: 'destructive' 
      });
    },
  });
};

