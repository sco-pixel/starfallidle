import { GameShell } from "../game-shell";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { defaultGameState, loadGameSave } from "@/lib/game-save";
import { syncHiscores } from "@/lib/hiscores";

export const dynamic = "force-dynamic";

export default async function Play() {
  const user = await getChatGPTUser();
  let initialState = defaultGameState();
  let saveAvailable = Boolean(user);
  let hasCloudSave = false;

  if (user) {
    try {
      const save = await loadGameSave(user.userId);
      initialState = save.state;
      hasCloudSave = save.exists;
      await syncHiscores(user.userId, initialState.displayName || user.displayName, initialState);
    }
    catch (error) { saveAvailable = false; console.error("Unable to load game save", error); }
  }

  return <main className="min-h-screen"><GameShell initialState={initialState} signedIn={Boolean(user)} saveAvailable={saveAvailable} hasCloudSave={hasCloudSave} accountId={user?.userId ?? null} accountName={user?.displayName ?? "Guest commander"} accountEmail={user?.email ?? null} signInPath={chatGPTSignInPath("/play")} signOutPath={chatGPTSignOutPath("/play")} /></main>;
}
