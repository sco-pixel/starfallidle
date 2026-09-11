"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { firebaseConfig } from "./firebase-config";

// Firebase Web configuration is intentionally public. Authentication and data
// access remain protected by Firebase provider settings and security rules.
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseGoogleProvider = new GoogleAuthProvider();

/**
 * Analytics only works in supported browsers, so it must never run during SSR.
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;

  try {
    return (await isSupported()) ? getAnalytics(firebaseApp) : null;
  } catch {
    return null;
  }
}
