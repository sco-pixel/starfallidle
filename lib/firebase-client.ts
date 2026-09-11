"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Firebase Web configuration is intentionally public. Authentication and data
// access remain protected by Firebase provider settings and security rules.
const firebaseConfig = {
  apiKey: "AIzaSyDnAyvrK7SCrT1NaSeZDK3UZMB7dDFd-LE",
  authDomain: "starfallidle-2e862.firebaseapp.com",
  projectId: "starfallidle-2e862",
  storageBucket: "starfallidle-2e862.firebasestorage.app",
  messagingSenderId: "93827228513",
  appId: "1:93827228513:web:76c88b2e09b90092de9b20",
  measurementId: "G-RX5XKTYQ4L",
};

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

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
