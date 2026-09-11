import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("idx_session_user_id").on(table.userId)]);

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("idx_account_user_id").on(table.userId),
  uniqueIndex("idx_account_provider_account").on(table.providerId, table.accountId),
]);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
}, (table) => [index("idx_verification_identifier").on(table.identifier)]);
