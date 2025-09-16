import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { getUserProfile, getUserProfilesBatch } from "./users";

export interface Card {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardSet {
  id: string;
  userId: string;
  title: string;
  cards: Card[];
  createdAt: Date;
  shared: boolean;
  isPublic?: boolean;
  creatorDisplayName?: string;
  tags?: string[];
}

const setsCollection = collection(db, "flashcardSets");

// Create a new flashcard set
export const createFlashcardSet = async (
  userId: string,
  title: string,
  cards: Omit<Card, "id">[],
  tags?: string[]
) => {
  const newCards = cards.map((card, index) => ({ ...card, id: `${Date.now()}-${index}` }));
  return await addDoc(setsCollection, {
    userId,
    title,
    cards: newCards,
    createdAt: serverTimestamp(),
    shared: true, // Default to shared
    isPublic: false, // Default to private
    tags: tags || [],
  });
};

// Get all flashcard sets for a user, ordered by creation date
export const getFlashcardSets = (
  userId: string,
  callback: (sets: FlashcardSet[]) => void,
  onError?: (error: unknown) => void
) => {
  const q = query(
    setsCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (querySnapshot) => {
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
      callback(sets);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

// Get a single flashcard set by ID
export const getFlashcardSet = async (setId: string): Promise<FlashcardSet | null> => {
    const docRef = doc(db, "flashcardSets", setId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as Partial<FlashcardSet>;
        const set: FlashcardSet = {
          id: docSnap.id,
          userId: data?.userId ?? "",
          title: data?.title ?? "Untitled",
          cards: Array.isArray(data?.cards) ? data.cards : [],
          createdAt: data?.createdAt || new Date(),
          shared: Boolean(data?.shared),
          isPublic: Boolean(data?.isPublic),
          tags: Array.isArray(data?.tags) ? data.tags : [],
        };
        
        // Fetch creator display name if this is a public set
        if (set.isPublic && set.userId) {
          try {
            // Use batch fetch even for single user to maintain consistency
            const userProfiles = await getUserProfilesBatch([set.userId]);
            const userProfile = userProfiles.get(set.userId);
            
            if (userProfile) {
              // Check if the creator wants to show their name on public sets
              if (userProfile.settings?.showNameOnPublicSets !== false) {
                set.creatorDisplayName = userProfile.displayName || "some user on this app";
              } else {
                set.creatorDisplayName = "someone";
              }
            } else {
              set.creatorDisplayName = "some user on this app";
            }
          } catch (error) {
            console.error(`Failed to fetch user profile for ${set.userId}:`, error);
            set.creatorDisplayName = "some user on this app";
          }
        }
        
        return set;
    } else {
        return null;
    }
}

// Update a flashcard set
export const updateFlashcardSet = async (
    setId: string,
    updates: Partial<Pick<FlashcardSet, 'title' | 'cards' | 'shared' | 'isPublic' | 'tags'>>
  ) => {
    const setDoc = doc(db, "flashcardSets", setId);
    return await updateDoc(setDoc, updates);
  };

// Delete a flashcard set
export const deleteFlashcardSet = async (setId: string) => {
    const setDoc = doc(db, "flashcardSets", setId);
    return await deleteDoc(setDoc);
};

// Duplicate a flashcard set
export const duplicateFlashcardSet = async (set: FlashcardSet, currentUserId: string) => {
    return await addDoc(setsCollection, {
        userId: currentUserId,
        title: `${set.title} (Copy)`,
        cards: set.cards,
        createdAt: serverTimestamp(),
        shared: true,
        isPublic: false, // Default to private
        tags: set.tags || [],
    });
};

// Duplicate a public set for the current user
export const duplicatePublicSet = async (publicSet: FlashcardSet, currentUserId: string) => {
    return await addDoc(setsCollection, {
        userId: currentUserId,
        title: `${publicSet.title} (Copy)`,
        cards: publicSet.cards,
        createdAt: serverTimestamp(),
        shared: true,
        isPublic: false, // Default to private
        tags: publicSet.tags || [],
    });
};

// Get all public flashcard sets with pagination
export const getPublicFlashcardSets = (
    callback: (sets: FlashcardSet[]) => void,
    onError?: (error: unknown) => void,
    pageSize: number = 20
) => {
    const q = query(
        setsCollection,
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        limit(pageSize)
    );
    return onSnapshot(
        q,
        async (querySnapshot) => {
            const sets: FlashcardSet[] = [];
            
            // First, collect all user IDs to batch fetch user profiles
            const userIds = new Set<string>();
            const setsData: Partial<FlashcardSet>[] = [];
            
            // Process each set and collect user IDs
            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data() as Partial<FlashcardSet>;
                const setData: Partial<FlashcardSet> = {
                    id: docSnap.id,
                    userId: data?.userId ?? "",
                    title: data?.title ?? "Untitled",
                    cards: Array.isArray(data?.cards) ? data.cards : [],
                    createdAt: data?.createdAt || new Date(),
                    shared: Boolean(data?.shared),
                    isPublic: Boolean(data?.isPublic),
                    tags: Array.isArray(data?.tags) ? data.tags : [],
                };
                
                if (setData.userId) {
                    userIds.add(setData.userId);
                }
                setsData.push(setData);
            }
            
            // Batch fetch all user profiles at once
            const userProfiles = await getUserProfilesBatch(Array.from(userIds));
            
            // Now process sets with pre-fetched user profiles
            for (const setData of setsData) {
                const set: FlashcardSet = setData as FlashcardSet;
                
                // Get creator display name from batch-fetched profiles
                if (set.userId) {
                    const userProfile = userProfiles.get(set.userId);
                    if (userProfile) {
                        // Check if the creator wants to show their name on public sets
                        if (userProfile.settings?.showNameOnPublicSets !== false) {
                            set.creatorDisplayName = userProfile.displayName || "some user on this app";
                        } else {
                            set.creatorDisplayName = "someone";
                        }
                    } else {
                        set.creatorDisplayName = "some user on this app";
                    }
                }
                
                sets.push(set);
            }
            
            callback(sets);
        },
        (error) => {
            if (onError) onError(error);
        }
    );
};