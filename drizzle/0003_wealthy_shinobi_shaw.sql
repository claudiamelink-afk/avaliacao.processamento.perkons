CREATE TABLE `question_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`questions` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
