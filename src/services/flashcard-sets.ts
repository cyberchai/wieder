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
} from "firebase/firestore";
import { getUserProfile } from "./users";

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
}

const setsCollection = collection(db, "flashcardSets");

// Create a new flashcard set
export const createFlashcardSet = async (
  userId: string,
  title: string,
  cards: Omit<Card, "id">[]
) => {
  const newCards = cards.map((card, index) => ({ ...card, id: `${Date.now()}-${index}` }));
  return await addDoc(setsCollection, {
    userId,
    title,
    cards: newCards,
    createdAt: serverTimestamp(),
    shared: true, // Default to shared
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
        };
        
        // Fetch creator display name if this is a public set
        if (set.isPublic && set.userId) {
          try {
            const userProfile = await getUserProfile(set.userId);
            set.creatorDisplayName = userProfile?.displayName || "some user on this app";
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
    updates: Partial<Pick<FlashcardSet, 'title' | 'cards' | 'shared' | 'isPublic'>>
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
export const duplicateFlashcardSet = async (set: FlashcardSet) => {
    return await addDoc(setsCollection, {
        userId: set.userId,
        title: `${set.title} (Copy)`,
        cards: set.cards,
        createdAt: serverTimestamp(),
        shared: true,
        isPublic: false, // Default to private
    });
};

// Get all public flashcard sets
export const getPublicFlashcardSets = (
    callback: (sets: FlashcardSet[]) => void,
    onError?: (error: unknown) => void
) => {
    const q = query(
        setsCollection,
        where("isPublic", "==", true),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(
        q,
        async (querySnapshot) => {
            const sets: FlashcardSet[] = [];
            
            // Process each set and fetch creator display names
            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data() as Partial<FlashcardSet>;
                const set: FlashcardSet = {
                    id: docSnap.id,
                    userId: data?.userId ?? "",
                    title: data?.title ?? "Untitled",
                    cards: Array.isArray(data?.cards) ? data.cards : [],
                    createdAt: data?.createdAt || new Date(),
                    shared: Boolean(data?.shared),
                    isPublic: Boolean(data?.isPublic),
                };
                
                // Fetch creator display name
                if (set.userId) {
                    try {
                        const userProfile = await getUserProfile(set.userId);
                        set.creatorDisplayName = userProfile?.displayName || "some user on this app";
                    } catch (error) {
                        console.error(`Failed to fetch user profile for ${set.userId}:`, error);
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