import { env } from "cloudflare:workers";
import { defaultGameState, sanitizeGameState, type GameState } from "./game-state";
import { syncHiscores } from "./hiscores";

export { defaultGameState, sanitizeGameState } from "./game-state";
export type { GameState, SkillId } from "./game-state";

function database(): D1Database {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

export async function loadGameState(userId: string): Promise<GameState> {
  return (await loadGameSave(userId)).state;
}

export async function loadGameSave(userId: string): Promise<{ state: GameState; exists: boolean }> {
  const row = await database().prepare("SELECT state_json FROM game_saves WHERE user_id = ? LIMIT 1").bind(userId).first<{ state_json: string }>();
  if (!row) return { state: defaultGameState(), exists: false };
  try { return { state: sanitizeGameState(JSON.parse(row.state_json)), exists: true }; }
  catch { return { state: defaultGameState(), exists: true }; }
}

export async function saveGameState(userId: string, state: GameState, displayName?: string): Promise<void> {
  await database().prepare(`INSERT INTO game_saves (user_id, state_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP`).bind(userId, JSON.stringify(state)).run();
  await syncHiscores(userId, state.displayName || displayName || "Unknown Commander", state);
}
