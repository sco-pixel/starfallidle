CREATE TABLE `hiscores` (
	`user_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`current_patrol` integer DEFAULT 1 NOT NULL,
	`total_level` integer DEFAULT 14 NOT NULL,
	`peak_total_level` integer DEFAULT 14 NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`all_time_xp` integer DEFAULT 0 NOT NULL,
	`weekly_xp` integer DEFAULT 0 NOT NULL,
	`week_key` text NOT NULL,
	`skills_json` text NOT NULL,
	`all_time_skills_json` text NOT NULL,
	`weekly_skills_json` text NOT NULL,
	`boss_victories` integer DEFAULT 0 NOT NULL,
	`missions_completed` integer DEFAULT 0 NOT NULL,
	`expeditions_completed` integer DEFAULT 0 NOT NULL,
	`patrol_commissions` integer DEFAULT 1 NOT NULL,
	`operations_mastered` integer DEFAULT 0 NOT NULL,
	`best_combat_streak` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_hiscores_all_time_xp` ON `hiscores` (`all_time_xp`);--> statement-breakpoint
CREATE INDEX `idx_hiscores_total_xp` ON `hiscores` (`total_xp`);--> statement-breakpoint
CREATE INDEX `idx_hiscores_weekly_xp` ON `hiscores` (`weekly_xp`);--> statement-breakpoint
CREATE INDEX `idx_hiscores_display_name` ON `hiscores` (`display_name`);