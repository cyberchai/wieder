import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { withPerformanceMonitoring } from "@/lib/performance-monitor";

export interface UserStats {
  uid: string;
  cardsStudied: number;
  wieds: number; // XP points
  studyStreak: number;
  lastStudyDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const statsCollection = collection(db, "userStats");

// Helper to get today's date string (YYYY-MM-DD) in UTC
const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper to check if two dates are consecutive days (date2 is the day after date1)
const isConsecutiveDay = (date1: Date, date2: Date): boolean => {
  const date1Str = date1.toISOString().split('T')[0];
  const date2Str = date2.toISOString().split('T')[0];
  const date1Obj = new Date(date1Str);
  const date2Obj = new Date(date2Str);
  const diffTime = date2Obj.getTime() - date1Obj.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays === 1;
};

// Get or create user stats
const getUserStatsDoc = async (uid: string): Promise<UserStats | null> => {
  try {
    const statsDoc = doc(statsCollection, uid);
    const docSnap = await getDoc(statsDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid: docSnap.id,
        cardsStudied: data.cardsStudied || 0,
        wieds: data.wieds || 0,
        studyStreak: data.studyStreak ?? 1, // Default to 1, not 0
        lastStudyDate: data.lastStudyDate?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserStats;
    }
    
    // Create new stats document if it doesn't exist
    const newStats: Omit<UserStats, 'createdAt' | 'updatedAt'> = {
      uid,
      cardsStudied: 0,
      wieds: 0,
      studyStreak: 1,
      lastStudyDate: null,
    };
    
    await setDoc(statsDoc, {
      ...newStats,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      ...newStats,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return null;
  }
};

// Track a card being studied (adds 1 to cardsStudied and 1 to wieds)
export const trackCardStudied = async (uid: string): Promise<void> => {
  return withPerformanceMonitoring(
    `trackCardStudied(${uid})`,
    async () => {
      try {
        const statsDoc = doc(statsCollection, uid);
        const now = new Date();
        const today = getTodayDateString();
        
        // Get current stats
        const currentStats = await getUserStatsDoc(uid);
        if (!currentStats) {
          throw new Error("Failed to get user stats");
        }
        
        // Calculate study streak
        let newStreak = currentStats.studyStreak;
        const lastStudyDate = currentStats.lastStudyDate;
        const todayDate = new Date(today);
        
        if (!lastStudyDate) {
          // First time studying - start at 1
          newStreak = 1;
        } else {
          const lastStudyDateString = lastStudyDate.toISOString().split('T')[0];
          const lastDate = new Date(lastStudyDateString);
          
          if (lastStudyDateString === today) {
            // Already studied today, don't increment streak
            newStreak = currentStats.studyStreak;
          } else if (isConsecutiveDay(lastDate, todayDate)) {
            // Consecutive day, increment streak
            newStreak = currentStats.studyStreak + 1;
          } else {
            // Not consecutive, reset streak to 1
            newStreak = 1;
          }
        }
        
        // Update stats
        await updateDoc(statsDoc, {
          cardsStudied: increment(1),
          wieds: increment(1),
          studyStreak: newStreak,
          lastStudyDate: Timestamp.fromDate(now),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error tracking card studied:", error);
        throw error;
      }
    }
  );
};

// Track a game being played (adds 100 to wieds)
export const trackGamePlayed = async (uid: string): Promise<void> => {
  return withPerformanceMonitoring(
    `trackGamePlayed(${uid})`,
    async () => {
      try {
        const statsDoc = doc(statsCollection, uid);
        
        // Ensure stats document exists
        await getUserStatsDoc(uid);
        
        // Update wieds
        await updateDoc(statsDoc, {
          wieds: increment(100),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error tracking game played:", error);
        throw error;
      }
    }
  );
};

// Get user stats
export const getUserStats = async (uid: string): Promise<UserStats | null> => {
  return withPerformanceMonitoring(
    `getUserStats(${uid})`,
    async () => {
      return getUserStatsDoc(uid);
    }
  );
};

// Get leaderboard (top 20 users by wieds)
export const getLeaderboard = async (limitCount: number = 20): Promise<UserStats[]> => {
  return withPerformanceMonitoring(
    `getLeaderboard(${limitCount})`,
    async () => {
      try {
        const q = query(
          statsCollection,
          orderBy("wieds", "desc"),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const leaderboard: UserStats[] = [];
        
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          leaderboard.push({
            uid: docSnap.id,
            cardsStudied: data.cardsStudied || 0,
            wieds: data.wieds || 0,
            studyStreak: data.studyStreak ?? 1, // Default to 1, not 0
            lastStudyDate: data.lastStudyDate?.toDate() || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as UserStats);
        });
        
        return leaderboard;
      } catch (error) {
        console.error("Error getting leaderboard:", error);
        return [];
      }
    }
  );
};

// Get user's leaderboard rank
export const getUserRank = async (uid: string): Promise<number | null> => {
  return withPerformanceMonitoring(
    `getUserRank(${uid})`,
    async () => {
      try {
        const userStats = await getUserStats(uid);
        if (!userStats || userStats.wieds === 0) return null;
        
        const q = query(
          statsCollection,
          orderBy("wieds", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        let rank = 1;
        
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id === uid) {
            return; // Skip the user themselves
          }
          const data = docSnap.data();
          const userWieds = userStats.wieds;
          const otherWieds = data.wieds || 0;
          
          if (otherWieds > userWieds) {
            rank++;
          }
        });
        
        return rank;
      } catch (error) {
        console.error("Error getting user rank:", error);
        return null;
      }
    }
  );
};
