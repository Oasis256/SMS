CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`shortName` varchar(50) NOT NULL,
	`code` varchar(20) NOT NULL,
	`type` enum('primary','secondary') NOT NULL,
	`location` varchar(100) NOT NULL,
	`address` text,
	`phone` varchar(20),
	`email` varchar(320),
	`principalName` varchar(200),
	`motto` varchar(300),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `academicCalendar` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `attendance` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `budgets` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `classes` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `expenseRequests` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `incomeRecords` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `payroll` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `staffRecords` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `students` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `subjects` ADD `schoolId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `schoolId` int;