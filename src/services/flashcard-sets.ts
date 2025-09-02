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
        const data = docSnap.data() as any;
        sets.push({
          id: docSnap.id,
          userId: data?.userId ?? "",
          title: data?.title ?? "Untitled",
          cards: Array.isArray(data?.cards) ? data.cards : [],
          createdAt: data?.createdAt,
          shared: Boolean(data?.shared),
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
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          userId: data?.userId ?? "",
          title: data?.title ?? "Untitled",
          cards: Array.isArray(data?.cards) ? data.cards : [],
          createdAt: data?.createdAt,
          shared: Boolean(data?.shared),
        } as FlashcardSet;
    } else {
        return null;
    }
}

// Update a flashcard set
export const updateFlashcardSet = async (
    setId: string,
    title: string,
    cards: Card[],
    shared?: boolean
  ) => {
    const setDoc = doc(db, "flashcardSets", setId);
    const dataToUpdate: { title: string; cards: Card[]; shared?: boolean } = {
      title,
      cards,
    };
    if (typeof shared === 'boolean') {
      dataToUpdate.shared = shared;
    }
    return await updateDoc(setDoc, dataToUpdate);
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
    });
};
