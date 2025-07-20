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
} from "firebase/firestore";
import type { User } from "firebase/auth";

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
  });
};

// Get all flashcard sets for a user
export const getFlashcardSets = (
  userId: string,
  callback: (sets: FlashcardSet[]) => void
) => {
  const q = query(setsCollection, where("userId", "==", userId));
  return onSnapshot(q, (querySnapshot) => {
    const sets: FlashcardSet[] = [];
    querySnapshot.forEach((doc) => {
      sets.push({ id: doc.id, ...doc.data() } as FlashcardSet);
    });
    callback(sets);
  });
};

// Get a single flashcard set by ID
export const getFlashcardSet = async (setId: string): Promise<FlashcardSet | null> => {
    const docRef = doc(db, "flashcardSets", setId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FlashcardSet;
    } else {
        return null;
    }
}

// Update a flashcard set
export const updateFlashcardSet = async (
    setId: string,
    title: string,
    cards: Card[]
  ) => {
    const setDoc = doc(db, "flashcardSets", setId);
    return await updateDoc(setDoc, {
      title,
      cards,
    });
  };

// Delete a flashcard set
export const deleteFlashcardSet = async (setId: string) => {
    const setDoc = doc(db, "flashcardSets", setId);
    return await deleteDoc(setDoc);
};
