import { NextResponse } from "next/server";
import { getFirebaseAccount } from "@/lib/firebase-accounts";
import { loadGameSave, saveGameState, sanitizeGameState } from "@/lib/game-save";
import { getFirebaseIdentity } from "@/lib/firebase-server";

async function getLinkedAccount(request: Request) {
  const firebaseUser = await getFirebaseIdentity(request);
  if (!firebaseUser) return null;
  return await getFirebaseAccount(firebaseUser.uid);
}

export async function GET(request: Request) {
  const account = await getLinkedAccount(request);
  if (!account) return NextResponse.json({ error: "Link this Google account to a Starfall commander first." }, { status: 403 });

  try {
    const save = await loadGameSave(account.userId);
    return NextResponse.json({ ...save, account: { email: account.email, displayName: account.displayName } });
  } catch {
    return NextResponse.json({ error: "Save unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const account = await getLinkedAccount(request);
  if (!account) return NextResponse.json({ error: "Link this Google account to a Starfall commander first." }, { status: 403 });

  try {
    const state = sanitizeGameState(await request.json());
    await saveGameState(account.userId, state, account.displayName ?? account.email ?? "Commander");
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Save unavailable" }, { status: 503 });
  }
}
