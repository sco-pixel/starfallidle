import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gameSaves = sqliteTable("game_saves", {
  userId: text("user_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const hiscores = sqliteTable("hiscores", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  currentPatrol: integer("current_patrol").notNull().default(1),
  totalLevel: integer("total_level").notNull().default(14),
  peakTotalLevel: integer("peak_total_level").notNull().default(14),
  totalXp: integer("total_xp").notNull().default(0),
  allTimeXp: integer("all_time_xp").notNull().default(0),
  weeklyXp: integer("weekly_xp").notNull().default(0),
  weekKey: text("week_key").notNull(),
  skillsJson: text("skills_json").notNull(),
  allTimeSkillsJson: text("all_time_skills_json").notNull(),
  weeklySkillsJson: text("weekly_skills_json").notNull(),
  bossVictories: integer("boss_victories").notNull().default(0),
  missionsCompleted: integer("missions_completed").notNull().default(0),
  expeditionsCompleted: integer("expeditions_completed").notNull().default(0),
  patrolCommissions: integer("patrol_commissions").notNull().default(1),
  operationsMastered: integer("operations_mastered").notNull().default(0),
  bestCombatStreak: integer("best_combat_streak").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_hiscores_all_time_xp").on(table.allTimeXp),
  index("idx_hiscores_total_xp").on(table.totalXp),
  index("idx_hiscores_weekly_xp").on(table.weeklyXp),
  index("idx_hiscores_display_name").on(table.displayName),
]);

export const firebaseAccounts = sqliteTable("firebase_accounts", {
  firebaseUid: text("firebase_uid").primaryKey(),
  userId: text("user_id").notNull().unique(),
  email: text("email"),
  displayName: text("display_name"),
  linkedAt: text("linked_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_firebase_accounts_email").on(table.email),
]);
