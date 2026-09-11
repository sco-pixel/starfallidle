import { Orbit } from "lucide-react";
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
      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><Orbit /></span>
          <div><p className="eyebrow">SECTOR // EREBUS</p><h1>Starfall Idle</h1></div>
        </div>
        <div className="account-area">
          {user ? <>
            <p className="greeting">Welcome aboard, <strong>{user.displayName}</strong></p>
            <a className="account-link" href={chatGPTSignOutPath("/")} target="_top">Sign out</a>
          </> : <>
            <p className="greeting">Guest commander</p>
            <a className="sign-in-link" href={chatGPTSignInPath("/")} target="_top">Sign in with ChatGPT</a>
          </>}
        </div>
      </header>
      <GameShell initialState={initialState} signedIn={Boolean(user)} saveAvailable={saveAvailable} signInPath={chatGPTSignInPath("/")} />
    </main>
  );
}
