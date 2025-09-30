PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_application_image` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`application_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_application_image`("id", "url", "application_id", "created_at", "updated_at") SELECT "id", "url", "application_id", "created_at", "updated_at" FROM `application_image`;--> statement-breakpoint
DROP TABLE `application_image`;--> statement-breakpoint
ALTER TABLE `__new_application_image` RENAME TO `application_image`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_application` (
	`id` text PRIMARY KEY NOT NULL,
	`developer_id` text NOT NULL,
	`name` text NOT NULL,
	`short_description` text NOT NULL,
	`full_description` text NOT NULL,
	`icon` text NOT NULL,
	`package_name` text NOT NULL,
	`track_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`developer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_application`("id", "developer_id", "name", "short_description", "full_description", "icon", "package_name", "track_name", "created_at", "updated_at") SELECT "id", "developer_id", "name", "short_description", "full_description", "icon", "package_name", "track_name", "created_at", "updated_at" FROM `application`;--> statement-breakpoint
DROP TABLE `application`;--> statement-breakpoint
ALTER TABLE `__new_application` RENAME TO `application`;--> statement-breakpoint
CREATE UNIQUE INDEX `application_packageName_unique` ON `application` (`package_name`);--> statement-breakpoint
CREATE TABLE `__new_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_account`("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") SELECT "id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at" FROM `account`;--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "expires_at", "token", "ip_address", "user_agent", "user_id", "created_at", "updated_at") SELECT "id", "expires_at", "token", "ip_address", "user_agent", "user_id", "created_at", "updated_at" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "email", "email_verified", "image", "created_at", "updated_at") SELECT "id", "name", "email", "email_verified", "image", "created_at", "updated_at" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `__new_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_verification`("id", "identifier", "value", "expires_at", "created_at", "updated_at") SELECT "id", "identifier", "value", "expires_at", "created_at", "updated_at" FROM `verification`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
ALTER TABLE `__new_verification` RENAME TO `verification`;--> statement-breakpoint
CREATE TABLE `__new_gifticon_product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`image_url` text,
	`category` text,
	`is_available` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_gifticon_product`("id", "name", "description", "price", "image_url", "category", "is_available", "created_at", "updated_at") SELECT "id", "name", "description", "price", "image_url", "category", "is_available", "created_at", "updated_at" FROM `gifticon_product`;--> statement-breakpoint
DROP TABLE `gifticon_product`;--> statement-breakpoint
ALTER TABLE `__new_gifticon_product` RENAME TO `gifticon_product`;--> statement-breakpoint
CREATE TABLE `__new_gifticon_purchase` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`price` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`code` text,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `gifticon_product`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_gifticon_purchase`("id", "user_id", "product_id", "price", "status", "code", "expires_at", "created_at", "updated_at") SELECT "id", "user_id", "product_id", "price", "status", "code", "expires_at", "created_at", "updated_at" FROM `gifticon_purchase`;--> statement-breakpoint
DROP TABLE `gifticon_purchase`;--> statement-breakpoint
ALTER TABLE `__new_gifticon_purchase` RENAME TO `gifticon_purchase`;--> statement-breakpoint
CREATE TABLE `__new_payment` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`developer_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`paid_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`developer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_payment`("id", "application_id", "developer_id", "amount", "status", "paid_at", "created_at", "updated_at") SELECT "id", "application_id", "developer_id", "amount", "status", "paid_at", "created_at", "updated_at" FROM `payment`;--> statement-breakpoint
DROP TABLE `payment`;--> statement-breakpoint
ALTER TABLE `__new_payment` RENAME TO `payment`;--> statement-breakpoint
CREATE TABLE `__new_point_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`reason` text NOT NULL,
	`balance` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_point_history`("id", "user_id", "amount", "type", "reason", "balance", "created_at", "updated_at") SELECT "id", "user_id", "amount", "type", "reason", "balance", "created_at", "updated_at" FROM `point_history`;--> statement-breakpoint
DROP TABLE `point_history`;--> statement-breakpoint
ALTER TABLE `__new_point_history` RENAME TO `point_history`;--> statement-breakpoint
CREATE TABLE `__new_user_point` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_point`("id", "user_id", "balance", "created_at", "updated_at") SELECT "id", "user_id", "balance", "created_at", "updated_at" FROM `user_point`;--> statement-breakpoint
DROP TABLE `user_point`;--> statement-breakpoint
ALTER TABLE `__new_user_point` RENAME TO `user_point`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_point_userId_unique` ON `user_point` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_app_test_config` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`required_days` integer DEFAULT 14 NOT NULL,
	`required_testers` integer DEFAULT 20 NOT NULL,
	`started_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`ended_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_app_test_config`("id", "application_id", "status", "required_days", "required_testers", "started_at", "ended_at", "created_at", "updated_at") SELECT "id", "application_id", "status", "required_days", "required_testers", "started_at", "ended_at", "created_at", "updated_at" FROM `app_test_config`;--> statement-breakpoint
DROP TABLE `app_test_config`;--> statement-breakpoint
ALTER TABLE `__new_app_test_config` RENAME TO `app_test_config`;--> statement-breakpoint
CREATE UNIQUE INDEX `app_test_config_applicationId_unique` ON `app_test_config` (`application_id`);--> statement-breakpoint
CREATE TABLE `__new_app_tester` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`tester_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tester_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_app_tester`("id", "application_id", "tester_id", "status", "created_at", "updated_at") SELECT "id", "application_id", "tester_id", "status", "created_at", "updated_at" FROM `app_tester`;--> statement-breakpoint
DROP TABLE `app_tester`;--> statement-breakpoint
ALTER TABLE `__new_app_tester` RENAME TO `app_tester`;--> statement-breakpoint
CREATE TABLE `__new_test_history` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`tester_id` text NOT NULL,
	`tested_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tester_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_test_history`("id", "application_id", "tester_id", "tested_at", "created_at", "updated_at") SELECT "id", "application_id", "tester_id", "tested_at", "created_at", "updated_at" FROM `test_history`;--> statement-breakpoint
DROP TABLE `test_history`;--> statement-breakpoint
ALTER TABLE `__new_test_history` RENAME TO `test_history`;