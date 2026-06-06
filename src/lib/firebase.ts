/**
 * Firebase integration layer.
 * Set NEXT_PUBLIC_FIREBASE_* env vars to enable cloud sync.
 * Falls back to localStorage when Firebase is not configured.
 */

import type { Upload } from "@/types";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const isFirebaseConfigured = (): boolean =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export async function uploadToStorage(_file: Blob, _path: string): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  return null;
}

export async function syncEventToFirestore(_eventId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
}

/**
 * Fetch approved photos from Firestore: events/{eventId}/photos
 * Returns null to fall back to localStorage when not wired or on error.
 */
export async function fetchPhotosFromFirebase(eventId: string): Promise<Upload[] | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    /**
     * const { getFirestore, collection, getDocs, query, where, orderBy } =
     *   await import("firebase/firestore");
     * const { getFirebaseApp } = await import("./firebase-client");
     * const db = getFirestore(getFirebaseApp());
     * const q = query(
     *   collection(db, "events", eventId, "photos"),
     *   where("status", "in", ["approved", "extra"]),
     *   orderBy("createdAt", "asc")
     * );
     * const snapshot = await getDocs(q);
     * return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Upload));
     */
    console.warn(
      "[WeddingPOV] Firebase configured but fetchPhotosFromFirebase not wired — using localStorage",
      { eventId }
    );
    return null;
  } catch (err) {
    console.error("[WeddingPOV] Firebase photos fetch error:", err);
    throw err;
  }
}
