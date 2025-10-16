PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_test_log` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`tester_id` text NOT NULL,
	`earned_points` integer NOT NULL,
	`tested_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tester_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_test_log`("id", "application_id", "tester_id", "earned_points", "tested_at") SELECT "id", "application_id", "tester_id", "earned_points", "tested_at" FROM `test_log`;--> statement-breakpoint
DROP TABLE `test_log`;--> statement-breakpoint
ALTER TABLE `__new_test_log` RENAME TO `test_log`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `test_log_applicationId_testerId_testedAt_unique` ON `test_log` (`application_id`,`tester_id`,`tested_at`);--> statement-breakpoint
CREATE TABLE `__new_tester` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`tester_id` text NOT NULL,
	`status` text DEFAULT 'ONGOING' NOT NULL,
	`earned_points` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tester_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tester`("id", "application_id", "tester_id", "status", "earned_points", "created_at", "updated_at") SELECT "id", "application_id", "tester_id", "status", "earned_points", "created_at", "updated_at" FROM `tester`;--> statement-breakpoint
DROP TABLE `tester`;--> statement-breakpoint
ALTER TABLE `__new_tester` RENAME TO `tester`;--> statement-breakpoint
CREATE UNIQUE INDEX `tester_applicationId_testerId_unique` ON `tester` (`application_id`,`tester_id`);--> statement-breakpoint
ALTER TABLE `application` ADD `price` integer DEFAULT 0 NOT NULL;