import { GameShell } from "./game-shell";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "./chatgpt-auth";
import { defaultGameState, loadGameState } from "@/lib/game-save";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  let initialState = defaultGameState();
  let saveAvailable = Boolean(user);

  if (user) {
    try { initialState = await loadGameState(user.userId); }
    catch (error) { saveAvailable = false; console.error("Unable to load game save", error); }
  }

  return (
    <main className="min-h-screen">
      <GameShell
        initialState={initialState}
        signedIn={Boolean(user)}
        saveAvailable={saveAvailable}
        accountName={user?.displayName ?? "Guest commander"}
        accountEmail={user?.email ?? null}
        signInPath={chatGPTSignInPath("/")}
        signOutPath={chatGPTSignOutPath("/")}
      />
    </main>
  );
}
