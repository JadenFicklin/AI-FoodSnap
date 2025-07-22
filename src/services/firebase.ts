import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { ref as dbRef, remove, set, get } from 'firebase/database';
import { auth, db, storage, realtimeDb } from '../config/firebase';

// Authentication functions
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create user data in Realtime Database
    const userRef = dbRef(realtimeDb, `users/${userCredential.user.uid}`);
    await set(userRef, {
      email: userCredential.user.email,
      username: username,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    // Store username mapping for availability checking
    const usernameRef = dbRef(realtimeDb, `usernames/${username}`);
    await set(usernameRef, {
      uid: userCredential.user.uid,
      createdAt: new Date().toISOString()
    });

    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const deleteAccount = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Get user data to find username
    const userRef = dbRef(realtimeDb, `users/${user.uid}`);
    const userSnapshot = await get(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      if (userData.username) {
        // Delete username mapping
        const usernameRef = dbRef(realtimeDb, `usernames/${userData.username}`);
        await remove(usernameRef);
      }
    }

    // Delete user data from Realtime Database
    await remove(userRef);

    // Delete user authentication account
    await deleteUser(user);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getUserData = async (uid: string) => {
  try {
    const userRef = dbRef(realtimeDb, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const checkUsernameAvailability = async (
  username: string
): Promise<boolean> => {
  try {
    const usernameRef = dbRef(realtimeDb, `usernames/${username}`);
    const snapshot = await get(usernameRef);
    return !snapshot.exists();
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
};

// Firestore functions
export const createDocument = async (
  collectionName: string,
  data: any,
  docId?: string
) => {
  try {
    if (docId) {
      await setDoc(doc(db, collectionName, docId), data);
      return docId;
    } else {
      const docRef = await addDoc(collection(db, collectionName), data);
      return docRef.id;
    }
  } catch (error) {
    throw error;
  }
};

export const getDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: any
) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    throw error;
  }
};

export const queryDocuments = async (
  collectionName: string,
  field: string,
  operator: any,
  value: any
) => {
  try {
    const q = query(
      collection(db, collectionName),
      where(field, operator, value)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

// Storage functions
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    throw error;
  }
};

export const deleteFile = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    throw error;
  }
};

export const getFileURL = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    throw error;
  }
};
