CREATE TABLE `game_saves` (
	`user_id` text PRIMARY KEY NOT NULL,
	`state_json` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
