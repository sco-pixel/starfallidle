CREATE TABLE `firebase_accounts` (
	`firebase_uid` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text,
	`display_name` text,
	`linked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `firebase_accounts_user_id_unique` ON `firebase_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_firebase_accounts_email` ON `firebase_accounts` (`email`);