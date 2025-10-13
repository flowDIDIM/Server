CREATE TABLE `webhook_history` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
DROP TABLE `payment`;--> statement-breakpoint
ALTER TABLE `application` ADD `payment_status` text DEFAULT 'PENDING' NOT NULL;