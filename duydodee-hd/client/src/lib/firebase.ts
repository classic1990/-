import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, setDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, type Firestore, type DocumentSnapshot, type QuerySnapshot, type DocumentData } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, type Auth, type User } from "firebase/auth";

// Firebase Configuration - ใช้ environment variables เท่านั้น
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

// Admin email constant - ใช้ environment variable
export const ADMIN_EMAIL: string = import.meta.env.VITE_ADMIN_EMAIL;

// Type definitions
export interface Episode {
  url: string;
  title?: string;
}

export interface Movie {
  id?: string;
  title: string;
  desc: string;
  category: "vertical" | "series";
  poster: string;
  badge?: string;
  isVip: boolean;
  episodes: Episode[];
  viewCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Collection references
export const artifactsCollection = collection(db, "artifacts");

// Authentication functions
export const loginWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore operations
export const getMovies = async (): Promise<(Movie & { id: string })[]> => {
  try {
    const q = query(artifactsCollection, orderBy("createdAt", "desc"));
    const snapshot: QuerySnapshot<DocumentData> = await getDocs(q);
    return snapshot.docs.map((docSnapshot: DocumentSnapshot<DocumentData>) => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    })) as (Movie & { id: string })[];
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
};

export const subscribeToMovies = (callback: (movies: (Movie & { id: string })[]) => void) => {
  const q = query(artifactsCollection, orderBy("createdAt", "desc"));
  return onSnapshot(q, 
    (snapshot: QuerySnapshot<DocumentData>) => {
      const movies = snapshot.docs.map((docSnapshot: DocumentSnapshot<DocumentData>) => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      })) as (Movie & { id: string })[];
      callback(movies);
    },
    (error) => {
      console.error("Error subscribing to movies:", error);
      callback([]); // Return empty array on error
    }
  );
};

export const addMovie = async (movie: Omit<Movie, "id" | "createdAt" | "updatedAt" | "viewCount">): Promise<string> => {
  try {
    const docRef = await addDoc(artifactsCollection, {
      ...movie,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding movie:", error);
    throw error;
  }
};

export const updateMovie = async (id: string, movie: Partial<Movie>): Promise<void> => {
  try {
    const docRef = doc(db, "artifacts", id);
    await updateDoc(docRef, {
      ...movie,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating movie:", error);
    throw error;
  }
};

export const deleteMovie = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "artifacts", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting movie:", error);
    throw error;
  }
};

export const incrementViewCount = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "artifacts", id);
    const docSnapshot = await getDoc(docRef);
    
    if (docSnapshot.exists()) {
      const currentData = docSnapshot.data();
      const currentCount = currentData.viewCount || 0;
      await updateDoc(docRef, {
        viewCount: currentCount + 1
      });
    } else {
      console.warn(`Movie with id ${id} not found`);
    }
  } catch (error) {
    console.error("Error incrementing view count:", error);
    throw error;
  }
};

export const isAdmin = (email: string | null | undefined): boolean => {
  return email === ADMIN_EMAIL;
};

// --- Comments (artifacts/{movieId}/comments) ---

export interface Comment {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userPhoto?: string;
  text: string;
  createdAt: Timestamp;
}

export const getCommentsRef = (movieId: string) => collection(db, "artifacts", movieId, "comments");

export const subscribeToComments = (
  movieId: string,
  callback: (comments: Comment[]) => void
) => {
  const commentsRef = getCommentsRef(movieId);
  const q = query(commentsRef, orderBy("createdAt", "asc"));
  return onSnapshot(q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const comments = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      })) as Comment[];
      callback(comments);
    },
    (error) => {
      console.error("Error subscribing to comments:", error);
      callback([]);
    }
  );
};

export const addComment = async (
  movieId: string,
  text: string,
  user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<void> => {
  const commentsRef = getCommentsRef(movieId);
  await addDoc(commentsRef, {
    userId: user.uid,
    userEmail: user.email || "",
    userName: user.displayName || null,
    userPhoto: user.photoURL || null,
    text: text.trim(),
    createdAt: serverTimestamp()
  });
};

// --- Favorites (users/{userId}/favorites) ---

export const getFavoritesRef = (userId: string) => collection(db, "users", userId, "favorites");

export const subscribeToFavorites = (
  userId: string,
  callback: (movieIds: string[]) => void
) => {
  const favoritesRef = getFavoritesRef(userId);
  return onSnapshot(favoritesRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const movieIds = snapshot.docs.map((d) => d.id);
      callback(movieIds);
    },
    (error) => {
      console.error("Error subscribing to favorites:", error);
      callback([]);
    }
  );
};

export const addFavorite = async (userId: string, movieId: string): Promise<void> => {
  const favRef = doc(db, "users", userId, "favorites", movieId);
  await setDoc(favRef, { movieId, createdAt: serverTimestamp() }, { merge: true });
};

export const removeFavorite = async (userId: string, movieId: string): Promise<void> => {
  const favRef = doc(db, "users", userId, "favorites", movieId);
  await deleteDoc(favRef);
};

export const toggleFavorite = async (
  userId: string | null,
  movieId: string,
  isCurrentlyFavorite: boolean
): Promise<boolean> => {
  if (!userId) return isCurrentlyFavorite;
  if (isCurrentlyFavorite) {
    await removeFavorite(userId, movieId);
    return false;
  } else {
    await addFavorite(userId, movieId);
    return true;
  }
};
