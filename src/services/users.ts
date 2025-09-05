import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

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
