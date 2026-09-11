import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { linkFirebaseAccount } from "@/lib/firebase-accounts";
import { getFirebaseIdentity } from "@/lib/firebase-server";

export async function POST(request: Request) {
  const chatgptUser = await getChatGPTUser();
  if (!chatgptUser) return NextResponse.json({ error: "Sign in with ChatGPT before linking Google." }, { status: 401 });

  const firebaseUser = await getFirebaseIdentity(request);
  if (!firebaseUser) return NextResponse.json({ error: "Your Google sign-in could not be verified." }, { status: 401 });

  try {
    const account = await linkFirebaseAccount(firebaseUser, chatgptUser.userId);
    return NextResponse.json({ linked: true, email: account.email, displayName: account.displayName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to link Google.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
