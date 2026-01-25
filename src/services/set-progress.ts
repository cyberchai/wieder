import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { withPerformanceMonitoring } from "@/lib/performance-monitor";

export type CardPerformance = 'weak' | 'strong' | 'neutral';

export interface SetProgress {
  setId: string;
  studiedCardIds: string[]; // Array of card IDs the user has studied
  weakCardIds: string[];    // Cards answered incorrectly or manually marked weak
  strongCardIds: string[];  // Cards answered correctly or manually marked strong
  lastStudiedAt: Date;
  updatedAt: Date;
}

// Helper to get the setProgress subcollection reference
const getSetProgressCollection = (userId: string) => {
  return collection(db, "users", userId, "setProgress");
};

// Helper to get a specific setProgress document reference
const getSetProgressDoc = (userId: string, setId: string) => {
  return doc(db, "users", userId, "setProgress", setId);
};

// Get progress for a single set
export const getSetProgress = async (
  userId: string,
  setId: string
): Promise<SetProgress | null> => {
  return withPerformanceMonitoring(
    `getSetProgress(${userId}, ${setId})`,
    async () => {
      try {
        const progressDoc = getSetProgressDoc(userId, setId);
        const docSnap = await getDoc(progressDoc);

        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            setId: docSnap.id,
            studiedCardIds: data.studiedCardIds || [],
            weakCardIds: data.weakCardIds || [],
            strongCardIds: data.strongCardIds || [],
            lastStudiedAt: data.lastStudiedAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as SetProgress;
        }

        return null;
      } catch (error) {
        console.error("Error getting set progress:", error);
        return null;
      }
    }
  );
};

// Batch fetch progress for multiple sets
export const getUserSetsProgress = async (
  userId: string,
  setIds: string[]
): Promise<Map<string, SetProgress>> => {
  return withPerformanceMonitoring(
    `getUserSetsProgress(${userId}, ${setIds.length} sets)`,
    async () => {
      const progressMap = new Map<string, SetProgress>();

      if (setIds.length === 0) {
        return progressMap;
      }

      try {
        // Fetch all progress documents for the user
        const progressCollection = getSetProgressCollection(userId);
        const querySnapshot = await getDocs(progressCollection);

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (setIds.includes(docSnap.id)) {
            progressMap.set(docSnap.id, {
              setId: docSnap.id,
              studiedCardIds: data.studiedCardIds || [],
              weakCardIds: data.weakCardIds || [],
              strongCardIds: data.strongCardIds || [],
              lastStudiedAt: data.lastStudiedAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          }
        });

        return progressMap;
      } catch (error) {
        console.error("Error getting user sets progress:", error);
        return progressMap;
      }
    }
  );
};

// Track a card as studied for a specific set
export const trackSetCardStudied = async (
  userId: string,
  setId: string,
  cardId: string
): Promise<void> => {
  return withPerformanceMonitoring(
    `trackSetCardStudied(${userId}, ${setId}, ${cardId})`,
    async () => {
      try {
        const progressDoc = getSetProgressDoc(userId, setId);
        const docSnap = await getDoc(progressDoc);

        if (docSnap.exists()) {
          // Document exists, update it with arrayUnion to avoid duplicates
          await updateDoc(progressDoc, {
            studiedCardIds: arrayUnion(cardId),
            lastStudiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Document doesn't exist, create it
          await setDoc(progressDoc, {
            setId,
            studiedCardIds: [cardId],
            weakCardIds: [],
            strongCardIds: [],
            lastStudiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error("Error tracking set card studied:", error);
        throw error;
      }
    }
  );
};

// Set card performance (weak/strong/neutral)
export const setCardPerformance = async (
  userId: string,
  setId: string,
  cardId: string,
  performance: CardPerformance
): Promise<void> => {
  return withPerformanceMonitoring(
    `setCardPerformance(${userId}, ${setId}, ${cardId}, ${performance})`,
    async () => {
      try {
        const progressDoc = getSetProgressDoc(userId, setId);
        const docSnap = await getDoc(progressDoc);

        if (docSnap.exists()) {
          // Build update object based on performance
          const updateData: Record<string, unknown> = {
            updatedAt: serverTimestamp(),
          };

          if (performance === 'weak') {
            // Add to weak, remove from strong
            updateData.weakCardIds = arrayUnion(cardId);
            updateData.strongCardIds = arrayRemove(cardId);
          } else if (performance === 'strong') {
            // Add to strong, remove from weak
            updateData.strongCardIds = arrayUnion(cardId);
            updateData.weakCardIds = arrayRemove(cardId);
          } else {
            // Neutral - remove from both arrays
            updateData.weakCardIds = arrayRemove(cardId);
            updateData.strongCardIds = arrayRemove(cardId);
          }

          await updateDoc(progressDoc, updateData);
        } else {
          // Document doesn't exist, create it
          const newDoc: Record<string, unknown> = {
            setId,
            studiedCardIds: [],
            weakCardIds: performance === 'weak' ? [cardId] : [],
            strongCardIds: performance === 'strong' ? [cardId] : [],
            lastStudiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(progressDoc, newDoc);
        }
      } catch (error) {
        console.error("Error setting card performance:", error);
        throw error;
      }
    }
  );
};

// Helper to get card performance from progress data
export const getCardPerformance = (
  progress: SetProgress | null,
  cardId: string
): CardPerformance => {
  if (!progress) return 'neutral';
  if (progress.weakCardIds.includes(cardId)) return 'weak';
  if (progress.strongCardIds.includes(cardId)) return 'strong';
  return 'neutral';
};

// Reset progress for a set (e.g., when user wants to start fresh)
export const resetSetProgress = async (
  userId: string,
  setId: string
): Promise<void> => {
  return withPerformanceMonitoring(
    `resetSetProgress(${userId}, ${setId})`,
    async () => {
      try {
        const progressDoc = getSetProgressDoc(userId, setId);
        await deleteDoc(progressDoc);
      } catch (error) {
        console.error("Error resetting set progress:", error);
        throw error;
      }
    }
  );
};

// Calculate progress percentage
export const calculateProgressPercentage = (
  studiedCardIds: string[],
  totalCards: number
): number => {
  if (totalCards === 0) return 0;
  return Math.min(100, Math.floor((studiedCardIds.length / totalCards) * 100));
};
