import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gameSaves = sqliteTable("game_saves", {
  userId: text("user_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
