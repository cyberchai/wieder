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
  type DocumentData,
} from "firebase/firestore";
import { withPerformanceMonitoring } from "@/lib/performance-monitor";

export interface UserSettings {
  soundEnabled: boolean;
  showNameOnPublicSets: boolean;
  fontFamily?: 'poppins' | 'shantell' | 'dyslexia';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  settings?: UserSettings;
  joinedSetIds?: string[];
  joinedGroupSetIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// A user a set is shared to (owner or joiner), trimmed to what avatars need
export interface SetMember {
  uid: string;
  displayName: string;
  photoURL?: string;
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

// Get every user profile (superadmin only — used by the admin console to pick a
// user to view. Firestore rules allow any signed-in user to read profiles, and
// the admin UI is what restricts this to the superadmin).
export const getAllUsers = async (): Promise<UserProfile[]> => {
  return withPerformanceMonitoring("getAllUsers", async () => {
    try {
      const querySnapshot = await getDocs(usersCollection);
      const users: UserProfile[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        users.push({
          uid: docSnap.id,
          displayName: data.displayName || "some user on this app",
          email: data.email || "",
          photoURL: data.photoURL,
          settings: data.settings,
          joinedSetIds: data.joinedSetIds || [],
          joinedGroupSetIds: data.joinedGroupSetIds || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      // Newest members first.
      users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  });
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
        joinedSetIds: data.joinedSetIds || [],
        joinedGroupSetIds: data.joinedGroupSetIds || [],
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
              joinedSetIds: data.joinedSetIds || [],
              joinedGroupSetIds: data.joinedGroupSetIds || [],
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

// Find everyone a set is shared to: its owner plus everyone who joined it
// (as a group set or a regular shared set). Deduped, owner first.
export const getSetMembers = async (
  setId: string,
  ownerId?: string
): Promise<SetMember[]> => {
  if (!setId) return [];

  return withPerformanceMonitoring(`getSetMembers(${setId})`, async () => {
    try {
      const toMember = (uid: string, data: DocumentData): SetMember => ({
        uid,
        displayName: data.displayName || "some user on this app",
        photoURL: data.photoURL,
      });

      const members = new Map<string, SetMember>();

      // Owner first, so they lead the avatar stack
      if (ownerId) {
        const ownerSnap = await getDoc(doc(usersCollection, ownerId));
        if (ownerSnap.exists()) {
          members.set(ownerId, toMember(ownerId, ownerSnap.data()));
        }
      }

      // Everyone who joined it (group sets and shared sets both count)
      const joinerSnapshots = await Promise.all([
        getDocs(query(usersCollection, where("joinedGroupSetIds", "array-contains", setId))),
        getDocs(query(usersCollection, where("joinedSetIds", "array-contains", setId))),
      ]);
      for (const snap of joinerSnapshots) {
        snap.forEach((docSnap) => {
          if (!members.has(docSnap.id)) {
            members.set(docSnap.id, toMember(docSnap.id, docSnap.data()));
          }
        });
      }

      return Array.from(members.values());
    } catch (error) {
      console.error("Error getting set members:", error);
      return [];
    }
  });
};

// Add a joined set ID to user's profile
export const addJoinedSetId = async (uid: string, setId: string) => {
  try {
    const userDoc = doc(usersCollection, uid);
    const userProfile = await getUserProfile(uid);
    
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    const currentJoinedSetIds = userProfile.joinedSetIds || [];
    if (!currentJoinedSetIds.includes(setId)) {
      const updatedJoinedSetIds = [...currentJoinedSetIds, setId];
      await updateDoc(userDoc, {
        joinedSetIds: updatedJoinedSetIds,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error adding joined set ID:", error);
    throw error;
  }
};

// Remove a joined set ID from user's profile
export const removeJoinedSetId = async (uid: string, setId: string) => {
  try {
    const userDoc = doc(usersCollection, uid);
    const userProfile = await getUserProfile(uid);
    
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    const currentJoinedSetIds = userProfile.joinedSetIds || [];
    const updatedJoinedSetIds = currentJoinedSetIds.filter(id => id !== setId);
    
    await updateDoc(userDoc, {
      joinedSetIds: updatedJoinedSetIds,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error removing joined set ID:", error);
    throw error;
  }
};

// Add a joined group set ID to user's profile
export const addJoinedGroupSetId = async (uid: string, setId: string) => {
  try {
    const userDoc = doc(usersCollection, uid);
    const userProfile = await getUserProfile(uid);
    
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    const currentJoinedGroupSetIds = userProfile.joinedGroupSetIds || [];
    if (!currentJoinedGroupSetIds.includes(setId)) {
      const updatedJoinedGroupSetIds = [...currentJoinedGroupSetIds, setId];
      await updateDoc(userDoc, {
        joinedGroupSetIds: updatedJoinedGroupSetIds,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error adding joined group set ID:", error);
    throw error;
  }
};

// Remove a joined group set ID from user's profile
export const removeJoinedGroupSetId = async (uid: string, setId: string) => {
  try {
    const userDoc = doc(usersCollection, uid);
    const userProfile = await getUserProfile(uid);
    
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    const currentJoinedGroupSetIds = userProfile.joinedGroupSetIds || [];
    const updatedJoinedGroupSetIds = currentJoinedGroupSetIds.filter(id => id !== setId);
    
    await updateDoc(userDoc, {
      joinedGroupSetIds: updatedJoinedGroupSetIds,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error removing joined group set ID:", error);
    throw error;
  }
};

// Migration function to move localStorage data to Firebase
export const migrateJoinedSetsToFirebase = async (uid: string) => {
  try {
    // Check if migration has already been done
    const userProfile = await getUserProfile(uid);
    if (userProfile?.joinedSetIds || userProfile?.joinedGroupSetIds) {
      return; // Already migrated
    }
    
    const userDoc = doc(usersCollection, uid);
    const joinedSetIds = JSON.parse(localStorage.getItem('joinedSetIds') || '[]');
    const joinedGroupSetIds = JSON.parse(localStorage.getItem('joinedGroupSetIds') || '[]');
    
    if (joinedSetIds.length > 0 || joinedGroupSetIds.length > 0) {
      await updateDoc(userDoc, {
        joinedSetIds,
        joinedGroupSetIds,
        updatedAt: new Date(),
      });
      
      // Clear localStorage after successful migration
      localStorage.removeItem('joinedSetIds');
      localStorage.removeItem('joinedGroupSetIds');
      
      console.log('Successfully migrated joined sets to Firebase');
    }
  } catch (error) {
    console.error("Error migrating joined sets to Firebase:", error);
    // Don't throw error to avoid breaking the app
  }
};
