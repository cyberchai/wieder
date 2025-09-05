import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserProfile, 
  createOrUpdateUserProfile, 
  updateUserSettings,
  type UserProfile,
  type UserSettings
} from '@/services/users';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';

// Query keys for user data
export const userQueryKeys = {
  all: ['users'] as const,
  profile: (uid: string) => [...userQueryKeys.all, 'profile', uid] as const,
  settings: (uid: string) => [...userQueryKeys.all, 'settings', uid] as const,
};

// Hook to get user profile
export const useUserProfile = (uid: string) => {
  return useQuery({
    queryKey: userQueryKeys.profile(uid),
    queryFn: () => getUserProfile(uid),
    enabled: !!uid,
    staleTime: 10 * 60 * 1000, // 10 minutes - user profiles don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook to get current user's profile
export const useCurrentUserProfile = () => {
  const { user } = useAuth();
  return useUserProfile(user?.uid || '');
};

// Hook to get user settings
export const useUserSettings = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: userQueryKeys.settings(user?.uid || ''),
    queryFn: async () => {
      if (!user) return null;
      const profile = await getUserProfile(user.uid);
      return profile?.settings || null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
};

// Mutation to create or update user profile
export const useCreateOrUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: createOrUpdateUserProfile,
    onSuccess: (_, userProfile) => {
      // Invalidate user profile queries
      queryClient.invalidateQueries({ 
        queryKey: userQueryKeys.profile(userProfile.uid) 
      });
      queryClient.invalidateQueries({ 
        queryKey: userQueryKeys.settings(userProfile.uid) 
      });
    },
    onError: (error) => {
      console.error('Failed to create/update user profile:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update profile.', 
        variant: 'destructive' 
      });
    },
  });
};

// Mutation to update user settings
export const useUpdateUserSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      if (!user) throw new Error('User not authenticated');
      return updateUserSettings(user.uid, settings);
    },
    onSuccess: (_, settings) => {
      // Update localStorage immediately for instant UI response
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Invalidate settings queries
      queryClient.invalidateQueries({ 
        queryKey: userQueryKeys.settings(user?.uid || '') 
      });
      queryClient.invalidateQueries({ 
        queryKey: userQueryKeys.profile(user?.uid || '') 
      });
      
      toast({ 
        title: 'Success', 
        description: 'Settings updated successfully.' 
      });
    },
    onError: (error) => {
      console.error('Failed to update user settings:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update settings.', 
        variant: 'destructive' 
      });
    },
  });
};

// Optimistic update for user settings
export const useOptimisticUpdateUserSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      if (!user) throw new Error('User not authenticated');
      return updateUserSettings(user.uid, settings);
    },
    onMutate: async (newSettings) => {
      if (!user) return;
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: userQueryKeys.settings(user.uid) 
      });
      
      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(
        userQueryKeys.settings(user.uid)
      );
      
      // Optimistically update
      queryClient.setQueryData<UserSettings>(
        userQueryKeys.settings(user.uid),
        newSettings
      );
      
      // Update localStorage immediately
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      // Return context with previous value
      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings && user) {
        queryClient.setQueryData(
          userQueryKeys.settings(user.uid),
          context.previousSettings
        );
        localStorage.setItem('userSettings', JSON.stringify(context.previousSettings));
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      if (user) {
        queryClient.invalidateQueries({ 
          queryKey: userQueryKeys.settings(user.uid) 
        });
        queryClient.invalidateQueries({ 
          queryKey: userQueryKeys.profile(user.uid) 
        });
      }
    },
  });
};
