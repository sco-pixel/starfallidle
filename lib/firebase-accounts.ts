import { env } from "cloudflare:workers";
import type { FirebaseIdentity } from "./firebase-server";

function database(): D1Database {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

export type FirebaseAccount = FirebaseIdentity & { userId: string };

export async function getFirebaseAccount(uid: string): Promise<FirebaseAccount | null> {
  return await database()
    .prepare("SELECT firebase_uid as uid, user_id as userId, email, display_name as displayName FROM firebase_accounts WHERE firebase_uid = ? LIMIT 1")
    .bind(uid)
    .first<FirebaseAccount>();
}

export async function linkFirebaseAccount(identity: FirebaseIdentity, userId: string): Promise<FirebaseAccount> {
  const db = database();
  const existingFirebase = await getFirebaseAccount(identity.uid);
  if (existingFirebase && existingFirebase.userId !== userId) {
    throw new Error("This Google account is already linked to a different Starfall commander.");
  }
  if (existingFirebase) return existingFirebase;

  const existingUser = await db
    .prepare("SELECT firebase_uid as uid, user_id as userId, email, display_name as displayName FROM firebase_accounts WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<FirebaseAccount>();
  if (existingUser && existingUser.uid !== identity.uid) {
    throw new Error("This commander already has a different Google account linked.");
  }
  if (existingUser) return existingUser;

  try {
    await db
      .prepare("INSERT INTO firebase_accounts (firebase_uid, user_id, email, display_name, linked_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)")
      .bind(identity.uid, userId, identity.email, identity.displayName)
      .run();
  } catch {
    const resolved = await getFirebaseAccount(identity.uid);
    if (resolved?.userId === userId) return resolved;
    throw new Error("Unable to link this Google account. Please try again.");
  }

  return { ...identity, userId };
}
