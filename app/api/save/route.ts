import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { saveGameState, sanitizeGameState } from "@/lib/game-save";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try {
    const state = sanitizeGameState(await request.json());
    await saveGameState(user.userId, state);
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to save game", error);
    return NextResponse.json({ error: "Save unavailable" }, { status: 503 });
  }
}
