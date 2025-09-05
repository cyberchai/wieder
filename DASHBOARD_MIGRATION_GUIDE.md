# Dashboard Migration Guide - React Query

This guide shows you how to migrate your existing dashboard to React Query **without rewriting everything**.

## 🎯 **What We're Changing**

We'll replace the data fetching logic while keeping all your existing UI, state management, and user interactions exactly the same.

## 📝 **Step-by-Step Migration**

### **Step 1: Add React Query Imports**

Add these imports to your existing `src/app/dashboard/page.tsx`:

```typescript
// Add these imports at the top
import {
  useUserFlashcardSets,
  usePublicFlashcardSets,
  useSharedFlashcardSets,
  useDeleteFlashcardSet,
  useUpdateFlashcardSet,
  useDuplicateFlashcardSet,
  useDuplicatePublicSet,
} from "@/hooks/use-flashcard-queries";
```

### **Step 2: Replace State Variables**

**Replace this:**
```typescript
const [sets, setSets] = useState<FlashcardSet[]>([]);
const [sharedSets, setSharedSets] = useState<FlashcardSet[]>([]);
const [groupSets, setGroupSets] = useState<FlashcardSet[]>([]);
const [publicSets, setPublicSets] = useState<FlashcardSet[]>([]);
const [loading, setLoading] = useState(true);
const [loadingShared, setLoadingShared] = useState(true);
const [loadingGroup, setLoadingGroup] = useState(true);
const [loadingPublic, setLoadingPublic] = useState(true);
```

**With this:**
```typescript
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

// Keep groupSets as is for now (it uses localStorage)
const [groupSets, setGroupSets] = useState<FlashcardSet[]>([]);
const [loadingGroup, setLoadingGroup] = useState(true);
```

### **Step 3: Replace useEffect Data Fetching**

**Remove this entire useEffect:**
```typescript
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
        // ... error handling
      }
    );
    // ... rest of the useEffect
    return () => unsubscribe();
  }
}, [user]);
```

**And this one:**
```typescript
useEffect(() => {
  const unsubscribe = getPublicFlashcardSets(
    (data) => {
      setPublicSets(data);
      setLoadingPublic(false);
    },
    (error) => {
      console.error("Failed to load public sets", error);
      setLoadingPublic(false);
    }
  );
  return () => unsubscribe();
}, [refreshPublicSets]);
```

**And this one:**
```typescript
useEffect(() => {
  const joinedSetIds = JSON.parse(localStorage.getItem('joinedSetIds') || '[]');
  if (joinedSetIds.length > 0) {
    const fetchSharedSets = async () => {
      // ... fetch logic
    };
    fetchSharedSets();
  } else {
    setLoadingShared(false);
  }
}, []);
```

**React Query handles all of this automatically!** 🎉

### **Step 4: Replace Mutation Functions**

**Replace these functions:**
```typescript
const handleDeleteClick = (setId: string) => {
  setDeletingId(setId);
  setIsDeleteDialogOpen(true);
};

const handleConfirmDelete = async () => {
  if (deletingId) {
    try {
      await deleteFlashcardSet(deletingId);
      // Track deletion
      if (user) {
        trackUserEngagement('delete_flashcard_set', { 
          set_id: deletingId,
          action: 'delete'
        }, user.uid);
      }
      toast({ title: "Success", description: "Set deleted successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete set.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  }
};
```

**With this:**
```typescript
// Add this near the top with other hooks
const deleteSetMutation = useDeleteFlashcardSet();
const updateSetMutation = useUpdateFlashcardSet();
const duplicateSetMutation = useDuplicateFlashcardSet();
const duplicatePublicSetMutation = useDuplicatePublicSet();

// Keep the same function signatures, just change the implementation
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
```

### **Step 5: Update Other Mutation Functions**

**Replace `handleTogglePublic`:**
```typescript
const handleTogglePublic = async (set: FlashcardSet) => {
  if (!user) return;
  
  try {
    const newPublicStatus = !set.isPublic;
    await updateFlashcardSet(set.id, { isPublic: newPublicStatus });
    
    // Update local state
    setSets(prev => prev.map(s => 
      s.id === set.id ? { ...s, isPublic: newPublicStatus } : s
    ));
    
    // Update public sets list
    if (newPublicStatus) {
      setPublicSets(prev => {
        if (!prev.find(s => s.id === set.id)) {
          return [...prev, { ...set, isPublic: newPublicStatus }];
        }
        return prev;
      });
    } else {
      setPublicSets(prev => prev.filter(s => s.id !== set.id));
    }
    
    toast({ 
      title: "Success", 
      description: `Set ${newPublicStatus ? 'made public' : 'made private'}.` 
    });
  } catch (error) {
    toast({ 
      title: "Error", 
      description: "Failed to update set visibility.", 
      variant: "destructive" 
    });
  }
};
```

**With this:**
```typescript
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
```

**Replace `handleDuplicate` and `handleDuplicatePublicSet` similarly.**

### **Step 6: Remove Unused Imports**

Remove these imports since React Query handles them:
```typescript
// Remove these
import { getFlashcardSets, deleteFlashcardSet, updateFlashcardSet, duplicateFlashcardSet, duplicatePublicSet, getFlashcardSet, getPublicFlashcardSets, type FlashcardSet } from "@/services/flashcard-sets";
```

### **Step 7: Add Cache Monitor (Optional)**

Add this to see cache performance in development:
```typescript
import { CacheMonitor } from "@/components/cache-monitor";

// Add this at the end of your JSX, before the closing </ProtectedRoute>
<CacheMonitor />
```

## 🎉 **That's It!**

Your dashboard will now:
- ✅ Use React Query for all data fetching
- ✅ Have automatic caching and background updates
- ✅ Show cache performance metrics
- ✅ Handle errors consistently
- ✅ Keep all your existing UI and functionality

## 📊 **What You'll See**

1. **Faster Loading**: Cached data loads instantly
2. **Cache Monitor**: Bottom-right corner shows cache performance
3. **Better UX**: No loading spinners for cached data
4. **Automatic Updates**: Data stays fresh automatically

## 🔧 **Testing the Migration**

1. **Start your dev server**: `npm run dev`
2. **Open the dashboard**: Look for the cache monitor
3. **Navigate around**: Watch cache hit rates
4. **Check console**: See performance metrics

The migration is **minimal** - you're just replacing the data fetching logic while keeping everything else exactly the same!
