import { env } from "cloudflare:workers";
import { MAX_SKILL_LEVEL, SKILL_IDS, levelFromXp, type GameState, type SkillId } from "./game-state";

export type HiscoreScope = "all" | "patrol" | "weekly";
export type HiscoreCategory = "overall" | SkillId;

type StoredHiscore = {
  current_patrol: number;
  total_xp: number;
  all_time_xp: number;
  weekly_xp: number;
  week_key: string;
  skills_json: string;
  all_time_skills_json: string;
  weekly_skills_json: string;
};

function database(): D1Database {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

function currentWeekKey(date = new Date()) {
  const day = date.getUTCDay() || 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 1));
  return monday.toISOString().slice(0, 10);
}

function parseScores(value: string | undefined) {
  try {
    const parsed = JSON.parse(value ?? "{}");
    return Object.fromEntries(SKILL_IDS.map((id) => [id, Math.max(0, Number(parsed[id]) || 0)])) as Record<SkillId, number>;
  } catch {
    return Object.fromEntries(SKILL_IDS.map((id) => [id, 0])) as Record<SkillId, number>;
  }
}

function skillScores(state: GameState) {
  return Object.fromEntries(SKILL_IDS.map((id) => [id, state.skills[id].xp])) as Record<SkillId, number>;
}

export async function syncHiscores(userId: string, displayName: string, state: GameState) {
  const db = database();
  const existing = await db.prepare("SELECT current_patrol, total_xp, all_time_xp, weekly_xp, week_key, skills_json, all_time_skills_json, weekly_skills_json FROM hiscores WHERE user_id = ? LIMIT 1").bind(userId).first<StoredHiscore>();
  const currentSkills = skillScores(state);
  const previousSkills = parseScores(existing?.skills_json);
  const previousAllTimeSkills = parseScores(existing?.all_time_skills_json);
  const weekKey = currentWeekKey();
  const sameWeek = existing?.week_key === weekKey;
  const previousWeeklySkills = sameWeek ? parseScores(existing?.weekly_skills_json) : parseScores(undefined);
  const allTimeSkills = { ...previousAllTimeSkills };
  const weeklySkills = { ...previousWeeklySkills };
  const newPatrol = Boolean(existing && state.patrol > existing.current_patrol);
  for (const id of SKILL_IDS) {
    const gain = newPatrol ? currentSkills[id] : Math.max(0, currentSkills[id] - previousSkills[id]);
    allTimeSkills[id] = existing ? previousAllTimeSkills[id] + gain : currentSkills[id];
    weeklySkills[id] = (sameWeek ? previousWeeklySkills[id] : 0) + gain;
  }
  const totalXp = Object.values(currentSkills).reduce((sum, xp) => sum + xp, 0);
  const previousTotalXp = existing?.total_xp ?? 0;
  const gain = newPatrol ? totalXp : Math.max(0, totalXp - previousTotalXp);
  const allTimeXp = existing ? existing.all_time_xp + gain : totalXp;
  const weeklyXp = (sameWeek ? existing?.weekly_xp ?? 0 : 0) + gain;
  const totalLevel = SKILL_IDS.reduce((sum, id) => sum + state.skills[id].level, 0);
  const bossVictories = Object.entries(state.combat.victories).filter(([id]) => id.startsWith("boss-")).reduce((sum, [, victories]) => sum + victories, 0);
  const operationsMastered = Object.values(state.operationMastery).filter((mastery) => mastery >= 100).length;
  const safeName = displayName.trim().slice(0, 32) || "Unknown Commander";

  await db.prepare(`INSERT INTO hiscores (
    user_id, display_name, current_patrol, total_level, peak_total_level, total_xp, all_time_xp, weekly_xp, week_key,
    skills_json, all_time_skills_json, weekly_skills_json, boss_victories, missions_completed, expeditions_completed,
    patrol_commissions, operations_mastered, best_combat_streak, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(user_id) DO UPDATE SET
    display_name = excluded.display_name, current_patrol = excluded.current_patrol, total_level = excluded.total_level,
    peak_total_level = MAX(hiscores.peak_total_level, excluded.total_level), total_xp = excluded.total_xp,
    all_time_xp = excluded.all_time_xp, weekly_xp = excluded.weekly_xp, week_key = excluded.week_key,
    skills_json = excluded.skills_json, all_time_skills_json = excluded.all_time_skills_json,
    weekly_skills_json = excluded.weekly_skills_json, boss_victories = MAX(hiscores.boss_victories, excluded.boss_victories),
    missions_completed = MAX(hiscores.missions_completed, excluded.missions_completed),
    expeditions_completed = MAX(hiscores.expeditions_completed, excluded.expeditions_completed),
    patrol_commissions = MAX(hiscores.patrol_commissions, excluded.patrol_commissions),
    operations_mastered = MAX(hiscores.operations_mastered, excluded.operations_mastered),
    best_combat_streak = MAX(hiscores.best_combat_streak, excluded.best_combat_streak), updated_at = CURRENT_TIMESTAMP`)
    .bind(userId, safeName, state.patrol, totalLevel, totalLevel, totalXp, allTimeXp, weeklyXp, weekKey,
      JSON.stringify(currentSkills), JSON.stringify(allTimeSkills), JSON.stringify(weeklySkills), bossVictories,
      state.missionsCompleted.length, state.completedExpeditions, state.patrol, operationsMastered, state.combat.bestStreak).run();
}

function rankingExpressions(category: HiscoreCategory, scope: HiscoreScope) {
  if (category === "overall") return {
    score: scope === "all" ? "all_time_xp" : scope === "weekly" ? "weekly_xp" : "total_xp",
    level: scope === "all" ? "peak_total_level" : "total_level",
  };
  const jsonColumn = scope === "all" ? "all_time_skills_json" : scope === "weekly" ? "weekly_skills_json" : "skills_json";
  const path = `$.${category}`;
  const score = `CAST(COALESCE(json_extract(${jsonColumn}, '${path}'), 0) AS INTEGER)`;
  return { score, level: score };
}

export async function getHiscores(options: { category: HiscoreCategory; scope: HiscoreScope; page: number; search: string; userId?: string }) {
  const db = database();
  const pageSize = 10;
  const page = Math.max(1, Math.min(1000, options.page));
  const offset = (page - 1) * pageSize;
  const { score, level } = rankingExpressions(options.category, options.scope);
  const search = options.search.trim().slice(0, 32).toLowerCase();
  const where = search ? "WHERE lower(display_name) LIKE ?" : "";
  const binds = search ? [`%${search}%`, pageSize, offset] : [pageSize, offset];
  const query = `WITH ranked AS (
    SELECT user_id, display_name, ${score} AS score, ${level} AS level_value,
      ROW_NUMBER() OVER (ORDER BY ${score} DESC, updated_at ASC, user_id ASC) AS rank
    FROM hiscores
  ) SELECT display_name, score, level_value, rank FROM ranked ${where} ORDER BY rank LIMIT ? OFFSET ?`;
  const rowsResult = await db.prepare(query).bind(...binds).all<{ display_name: string; score: number; level_value: number; rank: number }>();
  const countStatement = db.prepare(search ? "SELECT COUNT(*) AS total FROM hiscores WHERE lower(display_name) LIKE ?" : "SELECT COUNT(*) AS total FROM hiscores");
  const countResult = search
    ? await countStatement.bind(`%${search}%`).first<{ total: number }>()
    : await countStatement.first<{ total: number }>();
  const rows = (rowsResult.results ?? []).map((row) => ({
    rank: Number(row.rank), displayName: row.display_name, xp: Number(row.score),
    level: options.category === "overall" ? Number(row.level_value) : levelFromXp(Number(row.score)),
  }));
  const total = Number(countResult?.total ?? 0);

  let player = null;
  let record = null;
  if (options.userId) {
    const playerRow = await db.prepare(`WITH ranked AS (
      SELECT user_id, display_name, ${score} AS score, ${level} AS level_value,
      ROW_NUMBER() OVER (ORDER BY ${score} DESC, updated_at ASC, user_id ASC) AS rank FROM hiscores
    ) SELECT display_name, score, level_value, rank FROM ranked WHERE user_id = ? LIMIT 1`).bind(options.userId).first<{ display_name: string; score: number; level_value: number; rank: number }>();
    if (playerRow) player = { rank: Number(playerRow.rank), displayName: playerRow.display_name, xp: Number(playerRow.score), level: options.category === "overall" ? Number(playerRow.level_value) : levelFromXp(Number(playerRow.score)) };
    record = await db.prepare("SELECT display_name, total_level, all_time_xp, boss_victories, missions_completed, expeditions_completed, patrol_commissions, operations_mastered, best_combat_streak FROM hiscores WHERE user_id = ? LIMIT 1").bind(options.userId).first();
  }
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / pageSize)), player, record, maxSkillLevel: MAX_SKILL_LEVEL };
}
