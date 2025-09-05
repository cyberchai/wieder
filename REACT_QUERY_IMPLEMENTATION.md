# React Query Implementation Guide

This guide explains how to implement React Query caching and cache monitoring in your flashcard app.

## 🚀 What We've Implemented

### 1. **React Query Setup**
- ✅ Installed `@tanstack/react-query` and dev tools
- ✅ Created `QueryProvider` with cache monitoring
- ✅ Added to root layout with proper provider hierarchy

### 2. **Custom Query Hooks**
- ✅ `useUserFlashcardSets()` - Get user's flashcard sets with caching
- ✅ `useFlashcardSet(setId)` - Get single flashcard set
- ✅ `usePublicFlashcardSets()` - Get all public sets
- ✅ `useSharedFlashcardSets()` - Get shared sets from localStorage
- ✅ `useUserProfile(uid)` - Get user profile data
- ✅ `useUserSettings()` - Get user settings

### 3. **Mutation Hooks**
- ✅ `useCreateFlashcardSet()` - Create new sets with optimistic updates
- ✅ `useUpdateFlashcardSet()` - Update sets with cache invalidation
- ✅ `useDeleteFlashcardSet()` - Delete sets with immediate cache removal
- ✅ `useDuplicateFlashcardSet()` - Duplicate sets
- ✅ `useOptimisticUpdateFlashcardSet()` - Optimistic updates for better UX

### 4. **Cache Monitoring**
- ✅ Real-time cache hit/miss tracking
- ✅ Visual cache monitor component (development only)
- ✅ Analytics integration for cache performance
- ✅ Automatic metrics reporting

## 📊 Cache Monitoring Features

### **Real-time Metrics**
```typescript
const { metrics, getHitRate, reportMetrics, overallHitRate } = useCacheMetrics();
```

### **Cache Monitor Component**
- Shows overall hit rate percentage
- Displays individual query performance
- Real-time updates every 5 seconds
- Only visible in development mode

### **Analytics Integration**
- Sends cache performance data to Google Analytics
- Tracks hit rates, total requests, and query patterns
- Helps identify optimization opportunities

## 🔧 How to Use

### **1. Replace Direct Firebase Calls**

**Before (Direct Firebase):**
```typescript
const [sets, setSets] = useState<FlashcardSet[]>([]);
const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }
}, [user]);
```

**After (React Query):**
```typescript
const { 
  data: sets = [], 
  isLoading: loading, 
  error 
} = useUserFlashcardSets();
```

### **2. Use Mutations for Data Changes**

**Before:**
```typescript
const handleDelete = async (setId: string) => {
  try {
    await deleteFlashcardSet(setId);
    // Manual state update
    setSets(prev => prev.filter(set => set.id !== setId));
    toast({ title: "Success", description: "Set deleted successfully." });
  } catch (error) {
    toast({ title: "Error", description: "Failed to delete set.", variant: "destructive" });
  }
};
```

**After:**
```typescript
const deleteSetMutation = useDeleteFlashcardSet();

const handleDelete = async (setId: string) => {
  try {
    await deleteSetMutation.mutateAsync(setId);
    // Cache automatically updated, toast handled in mutation
  } catch (error) {
    // Error handling done in mutation
  }
};
```

### **3. Monitor Cache Performance**

```typescript
import { useCacheMetrics } from '@/providers/query-provider';

const { metrics, getHitRate, reportMetrics } = useCacheMetrics();

// Get hit rate for specific query
const userSetsHitRate = getHitRate('["flashcardSets","user","userId123"]');

// Report metrics to analytics
reportMetrics();
```

## 🎯 Cache Configuration

### **Query Defaults**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,      // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
```

### **Query-Specific Configuration**
```typescript
// User sets - shorter cache time (2 minutes)
const { data: userSets } = useQuery({
  queryKey: flashcardQueryKeys.userSets(user?.uid || ''),
  queryFn: () => fetchUserSets(user.uid),
  staleTime: 2 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

// User profile - longer cache time (10 minutes)
const { data: userProfile } = useQuery({
  queryKey: userQueryKeys.profile(uid),
  queryFn: () => getUserProfile(uid),
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});
```

## 📈 Performance Benefits

### **1. Automatic Caching**
- ✅ Data cached in memory
- ✅ Automatic background refetching
- ✅ Request deduplication
- ✅ Stale-while-revalidate pattern

### **2. Optimistic Updates**
- ✅ UI updates immediately
- ✅ Automatic rollback on error
- ✅ Better user experience

### **3. Cache Invalidation**
- ✅ Smart cache invalidation
- ✅ Related queries updated automatically
- ✅ No stale data issues

### **4. Error Handling**
- ✅ Automatic retries
- ✅ Error boundaries
- ✅ Consistent error states

## 🔍 Monitoring Cache Miss Patterns

### **1. Development Tools**
```typescript
// React Query DevTools (automatic in development)
<ReactQueryDevtools initialIsOpen={false} />

// Custom cache monitor
<CacheMonitor />
```

### **2. Analytics Tracking**
```typescript
// Automatic tracking in query provider
cacheMonitor.trackCacheHit(queryKey);
cacheMonitor.trackCacheMiss(queryKey);

// Manual reporting
cacheMonitor.reportMetrics();
```

### **3. Performance Metrics**
- **Hit Rate**: Percentage of requests served from cache
- **Total Requests**: Number of API calls made
- **Cache Hits**: Number of successful cache retrievals
- **Cache Misses**: Number of failed cache retrievals

## 🚀 Migration Strategy

### **Phase 1: Setup (Completed)**
- ✅ Install React Query
- ✅ Configure providers
- ✅ Create query hooks

### **Phase 2: Migrate Dashboard (In Progress)**
- ✅ Create example implementation
- 🔄 Replace existing dashboard
- 🔄 Test cache performance

### **Phase 3: Migrate Other Pages**
- 🔄 Study page
- 🔄 Create page
- 🔄 Edit page
- 🔄 Profile page

### **Phase 4: Optimize**
- 🔄 Fine-tune cache times
- 🔄 Add more optimistic updates
- 🔄 Implement prefetching

## 📝 Next Steps

### **1. Replace Current Dashboard**
```bash
# Backup current dashboard
mv src/app/dashboard/page.tsx src/app/dashboard/page-old.tsx

# Use React Query version
mv src/app/dashboard/page-with-react-query.tsx src/app/dashboard/page.tsx
```

### **2. Test Cache Performance**
1. Open browser dev tools
2. Look for cache monitor in bottom-right
3. Monitor hit rates as you navigate
4. Check console for performance metrics

### **3. Optimize Based on Metrics**
- Identify queries with low hit rates
- Adjust cache times for better performance
- Add prefetching for likely-needed data

## 🎉 Benefits You'll See

### **Immediate**
- ✅ Faster page loads (cached data)
- ✅ Better offline experience
- ✅ Reduced API calls
- ✅ Consistent loading states

### **Long-term**
- ✅ Better user experience
- ✅ Reduced server costs
- ✅ Improved performance metrics
- ✅ Easier debugging with dev tools

## 🔧 Troubleshooting

### **Common Issues**

1. **Cache not updating**
   - Check query key consistency
   - Verify cache invalidation
   - Use `queryClient.invalidateQueries()`

2. **Stale data**
   - Adjust `staleTime` configuration
   - Use `refetchOnWindowFocus: true`
   - Implement manual refetch triggers

3. **Memory usage**
   - Adjust `gcTime` (garbage collection time)
   - Use `queryClient.removeQueries()` for cleanup
   - Monitor cache size in dev tools

### **Debug Commands**
```typescript
// Clear all cache
queryClient.clear();

// Remove specific query
queryClient.removeQueries({ queryKey: ['flashcardSets'] });

// Force refetch
queryClient.invalidateQueries({ queryKey: ['flashcardSets'] });

// Get cache data
const cachedData = queryClient.getQueryData(['flashcardSets', 'user', userId]);
```

This implementation provides a solid foundation for caching in your flashcard app with comprehensive monitoring and optimization capabilities!

