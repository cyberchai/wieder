"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { createOrUpdateUserProfile } from '@/services/users';
import { setAnalyticsUserId } from '@/lib/analytics';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Create or update user profile when they sign in
        try {
          await createOrUpdateUserProfile({
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
          });
          
          // Set user ID in Google Analytics
          setAnalyticsUserId(user.uid);
        } catch (error) {
          console.error('Failed to create/update user profile:', error);
        }
      }
      
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-end">
                  <Skeleton className="h-8 w-24" />
                </div>
              </header>
              <main className="flex-1 container p-8">
                <Skeleton className="h-8 w-64 mb-8" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
                </div>
              </main>
            </div>
        )
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    if (loading || user) {
        return (
             <div className="flex flex-col min-h-screen items-center justify-center">
                <Skeleton className="h-48 w-full max-w-sm" />
            </div>
        )
    }

    return <>{children}</>;
};
