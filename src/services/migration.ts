// import { db } from "@/lib/firebase";
// import {
//   collection,
//   getDocs,
//   doc,
//   getDoc,
//   writeBatch,
//   serverTimestamp,
// } from "firebase/firestore";
// import {
//   createFlashcardSet,
// } from "./flashcard-sets";
// import type { FlashcardSet as FlashcardSetV2 } from "@/types/flashcards";

// // Old interface for migration
// interface FlashcardSetV1 {
//   id: string;
//   userId: string;
//   title: string;
//   cards: Array<{
//     id: string;
//     front: string;
//     back: string;
//   }>;
//   createdAt: any;
//   shared: boolean;
// }

// /**
//  * Migrate a single flashcard set from V1 to V2 format
//  */
// export const migrateFlashcardSet = async (setId: string): Promise<boolean> => {
//   try {
//     // Get the old set data
//     const oldSetDoc = await getDoc(doc(db, "flashcardSets", setId));
//     if (!oldSetDoc.exists()) {
//       console.log(`Set ${setId} not found`);
//       return false;
//     }

//     const oldSet = oldSetDoc.data() as FlashcardSetV1;
    
//     // Create new set with V2 structure
//     const newSetId = await createFlashcardSet({
//       title: oldSet.title,
//       cards: oldSet.cards.map(card => ({
//         front: card.front,
//         back: card.back,
//       })),
//       visibility: oldSet.shared ? "sharable" : "private"
//     });

//     console.log(`Migrated set ${setId} to new ID ${newSetId}`);
//     return true;
//   } catch (error) {
//     console.error(`Failed to migrate set ${setId}:`, error);
//     return false;
//   }
// };

// /**
//  * Migrate all flashcard sets from V1 to V2 format
//  */
// export const migrateAllFlashcardSets = async (): Promise<{
//   total: number;
//   migrated: number;
//   failed: number;
// }> => {
//   try {
//     const setsSnapshot = await getDocs(collection(db, "flashcardSets"));
//     const total = setsSnapshot.size;
//     let migrated = 0;
//     let failed = 0;

//     console.log(`Starting migration of ${total} flashcard sets...`);

//     for (const setDoc of setsSnapshot.docs) {
//       const success = await migrateFlashcardSet(setDoc.id);
//       if (success) {
//         migrated++;
//       } else {
//         failed++;
//       }

//       // Log progress
//       if ((migrated + failed) % 10 === 0) {
//         console.log(`Progress: ${migrated + failed}/${total}`);
//       }
//     }

//     console.log(`Migration complete: ${migrated} migrated, ${failed} failed`);
//     return { total, migrated, failed };
//   } catch (error) {
//     console.error("Migration failed:", error);
//     throw error;
//   }
// };

// /**
//  * Check if a set has been migrated to V2 format
//  */
// export const isSetMigrated = async (setId: string): Promise<boolean> => {
//   try {
//     // Check if the set has the new structure (has cards subcollection)
//     const cardsSnapshot = await getDocs(collection(db, "flashcardSets", setId, "cards"));
//     return cardsSnapshot.size > 0;
//   } catch (error) {
//     return false;
//   }
// };

// /**
//  * Get migration status for all sets
//  */
// export const getMigrationStatus = async (): Promise<{
//   total: number;
//   migrated: number;
//   notMigrated: number;
// }> => {
//   try {
//     const setsSnapshot = await getDocs(collection(db, "flashcardSets"));
//     const total = setsSnapshot.size;
//     let migrated = 0;
//     let notMigrated = 0;

//     for (const setDoc of setsSnapshot.docs) {
//       const isMigrated = await isSetMigrated(setDoc.id);
//       if (isMigrated) {
//         migrated++;
//       } else {
//         notMigrated++;
//       }
//     }

//     return { total, migrated, notMigrated };
//   } catch (error) {
//     console.error("Failed to get migration status:", error);
//     throw error;
//   }
// };
