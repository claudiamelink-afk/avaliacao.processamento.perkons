CREATE TABLE `results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`wpm` integer NOT NULL,
	`accuracy` integer NOT NULL,
	`infractions` integer NOT NULL,
	`plates` integer NOT NULL,
	`windows` integer NOT NULL,
	`overall` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
