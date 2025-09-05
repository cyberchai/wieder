import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { withPerformanceMonitoring } from "@/lib/performance-monitor";

export interface UserSettings {
  soundEnabled: boolean;
  showNameOnPublicSets: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  settings?: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const usersCollection = collection(db, "users");

// Create or update a user profile
export const createOrUpdateUserProfile = async (userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => {
  const userDoc = doc(usersCollection, userProfile.uid);
  const now = new Date();
  
  try {
    const existingDoc = await getDoc(userDoc);
    if (existingDoc.exists()) {
      // Update existing profile
      await updateDoc(userDoc, {
        displayName: userProfile.displayName,
        email: userProfile.email,
        photoURL: userProfile.photoURL,
        updatedAt: now,
      });
    } else {
      // Create new profile
      await setDoc(userDoc, {
        ...userProfile,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    throw error;
  }
};

// Get a user profile by UID
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = doc(usersCollection, uid);
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid: docSnap.id,
        displayName: data.displayName || "some user on this app",
        email: data.email || "",
        photoURL: data.photoURL,
        settings: data.settings,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Update user settings
export const updateUserSettings = async (uid: string, settings: UserSettings) => {
  try {
    const userDoc = doc(usersCollection, uid);
    await updateDoc(userDoc, {
      settings,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

// Batch fetch user profiles to avoid N+1 queries
export const getUserProfilesBatch = async (uids: string[]): Promise<Map<string, UserProfile>> => {
  if (uids.length === 0) return new Map();
  
  return withPerformanceMonitoring(
    `getUserProfilesBatch(${uids.length} users)`,
    async () => {
      try {
        // Firestore 'in' queries are limited to 10 items, so we need to batch them
        const batchSize = 10;
        const userProfiles = new Map<string, UserProfile>();
        
        for (let i = 0; i < uids.length; i += batchSize) {
          const batch = uids.slice(i, i + batchSize);
          const q = query(
            usersCollection,
            where(documentId(), 'in', batch)
          );
          
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const profile: UserProfile = {
              uid: docSnap.id,
              displayName: data.displayName || "some user on this app",
              email: data.email || "",
              photoURL: data.photoURL,
              settings: data.settings,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            };
            userProfiles.set(docSnap.id, profile);
          });
        }
        
        return userProfiles;
      } catch (error) {
        console.error("Error batch fetching user profiles:", error);
        return new Map();
      }
    }
  );
};
