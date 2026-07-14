SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
CREATE DATABASE IF NOT EXISTS sms;
USE sms;

-- Schema from drizzle migrations
CREATE TABLE `academicCalendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`eventType` enum('term_start','term_end','holiday','exam','meeting','event') NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date,
	`description` text,
	`schoolLocation` enum('kabale','equator','all'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academicCalendar_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personType` enum('student','staff') NOT NULL,
	`personId` int NOT NULL,
	`date` date NOT NULL,
	`clockIn` timestamp,
	`clockOut` timestamp,
	`status` enum('present','late','absent','on_leave','off_campus') NOT NULL DEFAULT 'absent',
	`location` enum('main_entrance','dormitory','mess','staff_room','admin_office'),
	`schoolLocation` enum('kabale','equator'),
	`biometricVerified` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`tableName` varchar(100),
	`recordId` int,
	`oldValue` text,
	`newValue` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`allocatedAmount` decimal(15,2) NOT NULL,
	`spentAmount` decimal(15,2) NOT NULL DEFAULT '0',
	`academicYear` varchar(10) NOT NULL,
	`term` enum('term1','term2','term3'),
	`schoolLocation` enum('kabale','equator'),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`gradeLevel` varchar(20) NOT NULL,
	`section` varchar(10),
	`schoolLocation` enum('kabale','equator'),
	`classTeacherId` int,
	`capacity` int DEFAULT 40,
	`academicYear` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `disciplineRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`incidentDate` date NOT NULL,
	`description` text NOT NULL,
	`severity` enum('minor','moderate','major') NOT NULL,
	`actionTaken` text,
	`reportedBy` int,
	`status` enum('open','resolved','escalated') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disciplineRecords_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `expenseRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`amount` decimal(15,2) NOT NULL,
	`currency` varchar(5) NOT NULL DEFAULT 'UGX',
	`category` varchar(100) NOT NULL,
	`supportingDocs` text,
	`status` enum('pending','finance_reviewed','principal_approved','rejected','paid','cancelled') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`financeReviewedBy` int,
	`financeReviewedAt` timestamp,
	`financeNotes` text,
	`budgetVerified` boolean DEFAULT false,
	`fundsAvailable` boolean DEFAULT false,
	`principalApprovedBy` int,
	`principalApprovedAt` timestamp,
	`principalNotes` text,
	`approvalPin` varchar(255),
	`paidBy` int,
	`paidAt` timestamp,
	`paymentMethod` enum('cash','bank_transfer','mobile_money','cheque'),
	`paymentReference` varchar(100),
	`schoolLocation` enum('kabale','equator'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenseRequests_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`classId` int NOT NULL,
	`term` enum('term1','term2','term3') NOT NULL,
	`academicYear` varchar(10) NOT NULL,
	`assessmentType` enum('continuous','midterm','final') NOT NULL,
	`score` decimal(5,2) NOT NULL,
	`maxScore` decimal(5,2) DEFAULT '100',
	`grade` varchar(5),
	`remarks` text,
	`enteredBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grades_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `incomeRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('sponsorship','student_fees','facility_rental','meal_sales','training_fees','agricultural_sales','donations','grants','other') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency` varchar(5) NOT NULL DEFAULT 'UGX',
	`description` text,
	`payerName` varchar(200),
	`payerContact` varchar(200),
	`studentId` int,
	`receiptNumber` varchar(50),
	`paymentDate` date NOT NULL,
	`paymentMethod` enum('cash','bank_transfer','mobile_money','cheque'),
	`schoolLocation` enum('kabale','equator'),
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incomeRecords_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `leaveRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`leaveType` enum('annual','sick','compassionate','maternity','paternity','professional_development') NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaveRequests_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `lessonPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`subjectId` int NOT NULL,
	`classId` int NOT NULL,
	`date` date NOT NULL,
	`topic` varchar(200) NOT NULL,
	`objectives` text,
	`content` text,
	`activities` text,
	`resources` text,
	`assessment` text,
	`status` enum('draft','submitted','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lessonPlans_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientType` enum('parent','sponsor','staff') NOT NULL,
	`recipientEmail` varchar(320),
	`recipientPhone` varchar(20),
	`subject` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`notificationType` enum('absence_alert','late_alert','fee_reminder','general') NOT NULL,
	`relatedStudentId` int,
	`sent` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `payroll` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`baseSalary` decimal(12,2) NOT NULL,
	`attendanceBonus` decimal(12,2) DEFAULT '0',
	`deductions` decimal(12,2) DEFAULT '0',
	`netSalary` decimal(12,2) NOT NULL,
	`daysWorked` int DEFAULT 0,
	`daysAbsent` int DEFAULT 0,
	`lateArrivals` int DEFAULT 0,
	`status` enum('draft','approved','paid') NOT NULL DEFAULT 'draft',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payroll_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `staffRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`employeeId` varchar(20) NOT NULL,
	`position` varchar(100),
	`department` varchar(100),
	`qualification` text,
	`dateOfJoining` date,
	`contractType` enum('permanent','contract','temporary'),
	`baseSalary` decimal(12,2),
	`schoolLocation` enum('kabale','equator'),
	`biometricId` varchar(64),
	`status` enum('active','on_leave','terminated','retired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `staffRecords_employeeId_unique` UNIQUE(`employeeId`)
);;

CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` varchar(20) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`dateOfBirth` date,
	`gender` enum('male','female'),
	`photoUrl` text,
	`homeAddress` text,
	`parentName` varchar(200),
	`parentPhone` varchar(20),
	`parentEmail` varchar(320),
	`emergencyContact` varchar(20),
	`admissionDate` date,
	`classId` int,
	`schoolLocation` enum('kabale','equator'),
	`studentType` enum('day','boarding'),
	`feeCategory` enum('primary','secondary','olevel','alevel'),
	`sponsorName` varchar(200),
	`sponsorContact` varchar(200),
	`sponsorAmount` decimal(12,2),
	`sponsorStartDate` date,
	`sponsorStatus` enum('active','inactive','pending'),
	`hasSpecialNeeds` boolean DEFAULT false,
	`specialNeedsNotes` text,
	`medicalConditions` text,
	`status` enum('active','graduated','transferred','suspended','withdrawn') NOT NULL DEFAULT 'active',
	`biometricId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_studentId_unique` UNIQUE(`studentId`)
);;

CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20) NOT NULL,
	`department` varchar(100),
	`gradeLevel` varchar(20),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`)
);;

CREATE TABLE `timetable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`subjectId` int NOT NULL,
	`teacherId` int NOT NULL,
	`dayOfWeek` enum('monday','tuesday','wednesday','thursday','friday') NOT NULL,
	`period` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`term` enum('term1','term2','term3') NOT NULL,
	`academicYear` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timetable_id` PRIMARY KEY(`id`)
);;

ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','principal','bursar','director_of_studies','teacher','department_head') NOT NULL DEFAULT 'user';;

ALTER TABLE `users` ADD `phone` varchar(20);;

ALTER TABLE `users` ADD `department` varchar(100);;

ALTER TABLE `users` ADD `schoolLocation` enum('kabale','equator');;

ALTER TABLE `users` ADD `approvalPin` varchar(255);;

ALTER TABLE `users` ADD `failedLoginAttempts` int DEFAULT 0 NOT NULL;;

ALTER TABLE `users` ADD `lockedUntil` timestamp;;

ALTER TABLE `users` ADD `lastActivity` timestamp;;

ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;;

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
);;

ALTER TABLE `academicCalendar` ADD `schoolId` int;;

ALTER TABLE `attendance` ADD `schoolId` int;;

ALTER TABLE `budgets` ADD `schoolId` int;;

ALTER TABLE `classes` ADD `schoolId` int;;

ALTER TABLE `expenseRequests` ADD `schoolId` int;;

ALTER TABLE `incomeRecords` ADD `schoolId` int;;

ALTER TABLE `payroll` ADD `schoolId` int;;

ALTER TABLE `staffRecords` ADD `schoolId` int;;

ALTER TABLE `students` ADD `schoolId` int;;

ALTER TABLE `subjects` ADD `schoolId` int;;

ALTER TABLE `users` ADD `schoolId` int;;

-- Data imports from CSV files
-- academicCalendar_20260714_193100.csv -> academicCalendar

-- attendance_20260714_193112.csv -> attendance

-- auditLogs_20260714_193120.csv -> auditLogs
INSERT INTO `auditLogs` (`id`, `userId`, `action`, `tableName`, `recordId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`) VALUES (1, 1, 'record_income', 'incomeRecords', NULL, NULL, '{"amount":"200000","category":"student_fees"}', NULL, '2026-07-14 12:53:05') ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`), `action` = VALUES(`action`), `tableName` = VALUES(`tableName`), `recordId` = VALUES(`recordId`), `oldValue` = VALUES(`oldValue`), `newValue` = VALUES(`newValue`), `ipAddress` = VALUES(`ipAddress`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `auditLogs` (`id`, `userId`, `action`, `tableName`, `recordId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`) VALUES (30001, 1, 'record_income', 'incomeRecords', NULL, NULL, '{"amount":"150000","category":"student_fees"}', NULL, '2026-07-14 12:56:30') ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`), `action` = VALUES(`action`), `tableName` = VALUES(`tableName`), `recordId` = VALUES(`recordId`), `oldValue` = VALUES(`oldValue`), `newValue` = VALUES(`newValue`), `ipAddress` = VALUES(`ipAddress`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `auditLogs` (`id`, `userId`, `action`, `tableName`, `recordId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`) VALUES (60001, 1, 'create_student', 'students', NULL, NULL, '{"studentId":"STU-MRKNQ0HC","name":"Den Kasozi"}', NULL, '2026-07-14 12:58:21') ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`), `action` = VALUES(`action`), `tableName` = VALUES(`tableName`), `recordId` = VALUES(`recordId`), `oldValue` = VALUES(`oldValue`), `newValue` = VALUES(`newValue`), `ipAddress` = VALUES(`ipAddress`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `auditLogs` (`id`, `userId`, `action`, `tableName`, `recordId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`) VALUES (90001, 1, 'update_role', 'users', 420002, NULL, 'admin', NULL, '2026-07-14 13:03:15') ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`), `action` = VALUES(`action`), `tableName` = VALUES(`tableName`), `recordId` = VALUES(`recordId`), `oldValue` = VALUES(`oldValue`), `newValue` = VALUES(`newValue`), `ipAddress` = VALUES(`ipAddress`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `auditLogs` (`id`, `userId`, `action`, `tableName`, `recordId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`) VALUES (120001, 1, 'create_student', 'students', NULL, NULL, '{"studentId":"STU-MRKP6FOA","name":"Nigo Davis"}', NULL, '2026-07-14 13:39:07') ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`), `action` = VALUES(`action`), `tableName` = VALUES(`tableName`), `recordId` = VALUES(`recordId`), `oldValue` = VALUES(`oldValue`), `newValue` = VALUES(`newValue`), `ipAddress` = VALUES(`ipAddress`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `auditLogs` (`id`, `userId`, `action`, `tableName`, `recordId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`) VALUES (150001, 1, 'record_income', 'incomeRecords', NULL, NULL, '{"amount":"200000","category":"student_fees"}', NULL, '2026-07-14 13:41:19') ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`), `action` = VALUES(`action`), `tableName` = VALUES(`tableName`), `recordId` = VALUES(`recordId`), `oldValue` = VALUES(`oldValue`), `newValue` = VALUES(`newValue`), `ipAddress` = VALUES(`ipAddress`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `auditLogs` (`id`, `userId`, `action`, `tableName`, `recordId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`) VALUES (180001, 1, 'submit_expense', 'expenseRequests', NULL, NULL, '{"title":"Electricity","amount":"50000"}', NULL, '2026-07-14 13:43:24') ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`), `action` = VALUES(`action`), `tableName` = VALUES(`tableName`), `recordId` = VALUES(`recordId`), `oldValue` = VALUES(`oldValue`), `newValue` = VALUES(`newValue`), `ipAddress` = VALUES(`ipAddress`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `auditLogs` (`id`, `userId`, `action`, `tableName`, `recordId`, `oldValue`, `newValue`, `ipAddress`, `createdAt`) VALUES (180002, 1, 'finance_review', 'expenseRequests', 1, NULL, NULL, NULL, '2026-07-14 13:43:42') ON DUPLICATE KEY UPDATE `userId` = VALUES(`userId`), `action` = VALUES(`action`), `tableName` = VALUES(`tableName`), `recordId` = VALUES(`recordId`), `oldValue` = VALUES(`oldValue`), `newValue` = VALUES(`newValue`), `ipAddress` = VALUES(`ipAddress`), `createdAt` = VALUES(`createdAt`);

-- budgets_20260714_193157.csv -> budgets

-- classes_20260714_193218.csv -> classes

-- classes_20260714_1932188.csv -> leaveRequests

-- disciplineRecords_20260714_193230.csv -> disciplineRecords

-- expenseRequests_20260714_193251.csv -> expenseRequests
INSERT INTO `expenseRequests` (`id`, `title`, `description`, `amount`, `currency`, `category`, `supportingDocs`, `status`, `requestedBy`, `requestedAt`, `financeReviewedBy`, `financeReviewedAt`, `financeNotes`, `budgetVerified`, `fundsAvailable`, `principalApprovedBy`, `principalApprovedAt`, `principalNotes`, `approvalPin`, `paidBy`, `paidAt`, `paymentMethod`, `paymentReference`, `schoolLocation`, `createdAt`, `updatedAt`, `schoolId`) VALUES (1, 'Electricity', 'Electricity top up', 50000.00, 'UGX', 'Maintenance', NULL, 'finance_reviewed', 1, '2026-07-14 13:43:24', 1, '2026-07-14 13:43:43', NULL, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-14 13:43:24', '2026-07-14 13:43:42', 3) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `description` = VALUES(`description`), `amount` = VALUES(`amount`), `currency` = VALUES(`currency`), `category` = VALUES(`category`), `supportingDocs` = VALUES(`supportingDocs`), `status` = VALUES(`status`), `requestedBy` = VALUES(`requestedBy`), `requestedAt` = VALUES(`requestedAt`), `financeReviewedBy` = VALUES(`financeReviewedBy`), `financeReviewedAt` = VALUES(`financeReviewedAt`), `financeNotes` = VALUES(`financeNotes`), `budgetVerified` = VALUES(`budgetVerified`), `fundsAvailable` = VALUES(`fundsAvailable`), `principalApprovedBy` = VALUES(`principalApprovedBy`), `principalApprovedAt` = VALUES(`principalApprovedAt`), `principalNotes` = VALUES(`principalNotes`), `approvalPin` = VALUES(`approvalPin`), `paidBy` = VALUES(`paidBy`), `paidAt` = VALUES(`paidAt`), `paymentMethod` = VALUES(`paymentMethod`), `paymentReference` = VALUES(`paymentReference`), `schoolLocation` = VALUES(`schoolLocation`), `createdAt` = VALUES(`createdAt`), `updatedAt` = VALUES(`updatedAt`), `schoolId` = VALUES(`schoolId`);

-- grades_20260714_193309.csv -> grades

-- incomeRecords_20260714_193323.csv -> incomeRecords
INSERT INTO `incomeRecords` (`id`, `category`, `amount`, `currency`, `description`, `payerName`, `payerContact`, `studentId`, `receiptNumber`, `paymentDate`, `paymentMethod`, `schoolLocation`, `recordedBy`, `createdAt`, `schoolId`) VALUES (1, 'student_fees', 200000.00, 'UGX', 'Money for Davis', 'Child Africa sponsor', 0774096407, NULL, 'RCP-MRKNJ8IH', '2026-07-14 00:00:00', 'cash', 'kabale', 1, '2026-07-14 12:53:05', NULL) ON DUPLICATE KEY UPDATE `category` = VALUES(`category`), `amount` = VALUES(`amount`), `currency` = VALUES(`currency`), `description` = VALUES(`description`), `payerName` = VALUES(`payerName`), `payerContact` = VALUES(`payerContact`), `studentId` = VALUES(`studentId`), `receiptNumber` = VALUES(`receiptNumber`), `paymentDate` = VALUES(`paymentDate`), `paymentMethod` = VALUES(`paymentMethod`), `schoolLocation` = VALUES(`schoolLocation`), `recordedBy` = VALUES(`recordedBy`), `createdAt` = VALUES(`createdAt`), `schoolId` = VALUES(`schoolId`);
INSERT INTO `incomeRecords` (`id`, `category`, `amount`, `currency`, `description`, `payerName`, `payerContact`, `studentId`, `receiptNumber`, `paymentDate`, `paymentMethod`, `schoolLocation`, `recordedBy`, `createdAt`, `schoolId`) VALUES (30001, 'student_fees', 150000.00, 'UGX', 'Home', 'Davis', 0774096407, NULL, 'RCP-MRKNNMST', '2026-07-14 00:00:00', 'mobile_money', 'equator', 1, '2026-07-14 12:56:30', NULL) ON DUPLICATE KEY UPDATE `category` = VALUES(`category`), `amount` = VALUES(`amount`), `currency` = VALUES(`currency`), `description` = VALUES(`description`), `payerName` = VALUES(`payerName`), `payerContact` = VALUES(`payerContact`), `studentId` = VALUES(`studentId`), `receiptNumber` = VALUES(`receiptNumber`), `paymentDate` = VALUES(`paymentDate`), `paymentMethod` = VALUES(`paymentMethod`), `schoolLocation` = VALUES(`schoolLocation`), `recordedBy` = VALUES(`recordedBy`), `createdAt` = VALUES(`createdAt`), `schoolId` = VALUES(`schoolId`);
INSERT INTO `incomeRecords` (`id`, `category`, `amount`, `currency`, `description`, `payerName`, `payerContact`, `studentId`, `receiptNumber`, `paymentDate`, `paymentMethod`, `schoolLocation`, `recordedBy`, `createdAt`, `schoolId`) VALUES (60001, 'student_fees', 200000.00, 'UGX', 'School fees balance', 'Nigo Davis', 0774096407, NULL, 'RCP-MRKP99B0', '2026-07-14 00:00:00', 'cash', NULL, 1, '2026-07-14 13:41:19', 3) ON DUPLICATE KEY UPDATE `category` = VALUES(`category`), `amount` = VALUES(`amount`), `currency` = VALUES(`currency`), `description` = VALUES(`description`), `payerName` = VALUES(`payerName`), `payerContact` = VALUES(`payerContact`), `studentId` = VALUES(`studentId`), `receiptNumber` = VALUES(`receiptNumber`), `paymentDate` = VALUES(`paymentDate`), `paymentMethod` = VALUES(`paymentMethod`), `schoolLocation` = VALUES(`schoolLocation`), `recordedBy` = VALUES(`recordedBy`), `createdAt` = VALUES(`createdAt`), `schoolId` = VALUES(`schoolId`);

-- lessonPlans_20260714_193423.csv -> lessonPlans

-- notifications_20260714_193435.csv -> notifications

-- payroll_20260714_193455.csv -> payroll

-- schools_20260714_193507.csv -> schools
INSERT INTO `schools` (`id`, `name`, `shortName`, `code`, `type`, `location`, `address`, `phone`, `email`, `principalName`, `motto`, `isActive`, `createdAt`) VALUES (1, 'Child Africa Junior School - Kabale', 'CA Jnr. Kabale', 'CA-KBL', 'primary', 'Kabale', NULL, NULL, NULL, NULL, 'Nurturing Young Minds for a Brighter Africa', 1, '2026-07-14 12:32:39') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `shortName` = VALUES(`shortName`), `code` = VALUES(`code`), `type` = VALUES(`type`), `location` = VALUES(`location`), `address` = VALUES(`address`), `phone` = VALUES(`phone`), `email` = VALUES(`email`), `principalName` = VALUES(`principalName`), `motto` = VALUES(`motto`), `isActive` = VALUES(`isActive`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `schools` (`id`, `name`, `shortName`, `code`, `type`, `location`, `address`, `phone`, `email`, `principalName`, `motto`, `isActive`, `createdAt`) VALUES (2, 'Child Africa Junior School - Equator', 'CA Jnr. Equator', 'CA-EQT', 'primary', 'Equator', NULL, NULL, NULL, NULL, 'Nurturing Young Minds for a Brighter Africa', 1, '2026-07-14 12:32:39') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `shortName` = VALUES(`shortName`), `code` = VALUES(`code`), `type` = VALUES(`type`), `location` = VALUES(`location`), `address` = VALUES(`address`), `phone` = VALUES(`phone`), `email` = VALUES(`email`), `principalName` = VALUES(`principalName`), `motto` = VALUES(`motto`), `isActive` = VALUES(`isActive`), `createdAt` = VALUES(`createdAt`);
INSERT INTO `schools` (`id`, `name`, `shortName`, `code`, `type`, `location`, `address`, `phone`, `email`, `principalName`, `motto`, `isActive`, `createdAt`) VALUES (3, 'Solberg College - Kabale', 'Solberg College', 'SOL-KBL', 'secondary', 'Kabale', NULL, NULL, NULL, NULL, 'Excellence Through Knowledge', 1, '2026-07-14 12:32:39') ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `shortName` = VALUES(`shortName`), `code` = VALUES(`code`), `type` = VALUES(`type`), `location` = VALUES(`location`), `address` = VALUES(`address`), `phone` = VALUES(`phone`), `email` = VALUES(`email`), `principalName` = VALUES(`principalName`), `motto` = VALUES(`motto`), `isActive` = VALUES(`isActive`), `createdAt` = VALUES(`createdAt`);

-- staffRecords_20260714_193515.csv -> staffRecords

-- students_20260714_193522.csv -> students
INSERT INTO `students` (`id`, `studentId`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `photoUrl`, `homeAddress`, `parentName`, `parentPhone`, `parentEmail`, `emergencyContact`, `admissionDate`, `classId`, `schoolLocation`, `studentType`, `feeCategory`, `sponsorName`, `sponsorContact`, `sponsorAmount`, `sponsorStartDate`, `sponsorStatus`, `hasSpecialNeeds`, `specialNeedsNotes`, `medicalConditions`, `status`, `biometricId`, `createdAt`, `updatedAt`, `schoolId`) VALUES (1, 'STU-MRKNQ0HC', 'Den', 'Kasozi', NULL, 'male', NULL, NULL, 'Mutima', 0704296407, NULL, NULL, '2026-07-14 00:00:00', NULL, NULL, 'boarding', 'primary', 'Self', NULL, NULL, NULL, NULL, 0, NULL, NULL, 'active', NULL, '2026-07-14 12:58:21', '2026-07-14 12:58:21', NULL) ON DUPLICATE KEY UPDATE `studentId` = VALUES(`studentId`), `firstName` = VALUES(`firstName`), `lastName` = VALUES(`lastName`), `dateOfBirth` = VALUES(`dateOfBirth`), `gender` = VALUES(`gender`), `photoUrl` = VALUES(`photoUrl`), `homeAddress` = VALUES(`homeAddress`), `parentName` = VALUES(`parentName`), `parentPhone` = VALUES(`parentPhone`), `parentEmail` = VALUES(`parentEmail`), `emergencyContact` = VALUES(`emergencyContact`), `admissionDate` = VALUES(`admissionDate`), `classId` = VALUES(`classId`), `schoolLocation` = VALUES(`schoolLocation`), `studentType` = VALUES(`studentType`), `feeCategory` = VALUES(`feeCategory`), `sponsorName` = VALUES(`sponsorName`), `sponsorContact` = VALUES(`sponsorContact`), `sponsorAmount` = VALUES(`sponsorAmount`), `sponsorStartDate` = VALUES(`sponsorStartDate`), `sponsorStatus` = VALUES(`sponsorStatus`), `hasSpecialNeeds` = VALUES(`hasSpecialNeeds`), `specialNeedsNotes` = VALUES(`specialNeedsNotes`), `medicalConditions` = VALUES(`medicalConditions`), `status` = VALUES(`status`), `biometricId` = VALUES(`biometricId`), `createdAt` = VALUES(`createdAt`), `updatedAt` = VALUES(`updatedAt`), `schoolId` = VALUES(`schoolId`);
INSERT INTO `students` (`id`, `studentId`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `photoUrl`, `homeAddress`, `parentName`, `parentPhone`, `parentEmail`, `emergencyContact`, `admissionDate`, `classId`, `schoolLocation`, `studentType`, `feeCategory`, `sponsorName`, `sponsorContact`, `sponsorAmount`, `sponsorStartDate`, `sponsorStatus`, `hasSpecialNeeds`, `specialNeedsNotes`, `medicalConditions`, `status`, `biometricId`, `createdAt`, `updatedAt`, `schoolId`) VALUES (30001, 'STU-MRKP6FOA', 'Nigo', 'Davis', NULL, 'male', NULL, NULL, 'Solberg', 0774096407, 'dmk.hero23@gmail.com', NULL, '2026-07-14 00:00:00', NULL, NULL, 'boarding', 'alevel', 'Self', NULL, NULL, NULL, NULL, 0, NULL, NULL, 'active', NULL, '2026-07-14 13:39:07', '2026-07-14 13:39:07', 3) ON DUPLICATE KEY UPDATE `studentId` = VALUES(`studentId`), `firstName` = VALUES(`firstName`), `lastName` = VALUES(`lastName`), `dateOfBirth` = VALUES(`dateOfBirth`), `gender` = VALUES(`gender`), `photoUrl` = VALUES(`photoUrl`), `homeAddress` = VALUES(`homeAddress`), `parentName` = VALUES(`parentName`), `parentPhone` = VALUES(`parentPhone`), `parentEmail` = VALUES(`parentEmail`), `emergencyContact` = VALUES(`emergencyContact`), `admissionDate` = VALUES(`admissionDate`), `classId` = VALUES(`classId`), `schoolLocation` = VALUES(`schoolLocation`), `studentType` = VALUES(`studentType`), `feeCategory` = VALUES(`feeCategory`), `sponsorName` = VALUES(`sponsorName`), `sponsorContact` = VALUES(`sponsorContact`), `sponsorAmount` = VALUES(`sponsorAmount`), `sponsorStartDate` = VALUES(`sponsorStartDate`), `sponsorStatus` = VALUES(`sponsorStatus`), `hasSpecialNeeds` = VALUES(`hasSpecialNeeds`), `specialNeedsNotes` = VALUES(`specialNeedsNotes`), `medicalConditions` = VALUES(`medicalConditions`), `status` = VALUES(`status`), `biometricId` = VALUES(`biometricId`), `createdAt` = VALUES(`createdAt`), `updatedAt` = VALUES(`updatedAt`), `schoolId` = VALUES(`schoolId`);

-- subjects_20260714_193607.csv -> subjects

-- timetable_20260714_193619.csv -> timetable

-- users_20260714_162406.csv -> users
INSERT INTO `users` (`id`, `openId`, `name`, `email`, `loginMethod`, `role`, `createdAt`, `updatedAt`, `lastSignedIn`, `phone`, `department`, `schoolLocation`, `approvalPin`, `failedLoginAttempts`, `lockedUntil`, `lastActivity`, `isActive`, `schoolId`) VALUES (1, 'HpcmMUBKkjPFqMa7CrzUrp', 'NIGO DAVIS', 'dmk.hero23@gmail.com', 'google', 'admin', '2026-07-14 11:55:54', '2026-07-14 16:22:26', '2026-07-14 16:22:26', NULL, NULL, NULL, NULL, 0, NULL, NULL, 1, NULL) ON DUPLICATE KEY UPDATE `openId` = VALUES(`openId`), `name` = VALUES(`name`), `email` = VALUES(`email`), `loginMethod` = VALUES(`loginMethod`), `role` = VALUES(`role`), `createdAt` = VALUES(`createdAt`), `updatedAt` = VALUES(`updatedAt`), `lastSignedIn` = VALUES(`lastSignedIn`), `phone` = VALUES(`phone`), `department` = VALUES(`department`), `schoolLocation` = VALUES(`schoolLocation`), `approvalPin` = VALUES(`approvalPin`), `failedLoginAttempts` = VALUES(`failedLoginAttempts`), `lockedUntil` = VALUES(`lockedUntil`), `lastActivity` = VALUES(`lastActivity`), `isActive` = VALUES(`isActive`), `schoolId` = VALUES(`schoolId`);
INSERT INTO `users` (`id`, `openId`, `name`, `email`, `loginMethod`, `role`, `createdAt`, `updatedAt`, `lastSignedIn`, `phone`, `department`, `schoolLocation`, `approvalPin`, `failedLoginAttempts`, `lockedUntil`, `lastActivity`, `isActive`, `schoolId`) VALUES (420002, 'G4FESM7PzKf4nSJwmtywmy', 'Oasis Inocent', 'oasis.sybill@gmail.com', 'google', 'admin', '2026-07-14 13:01:40', '2026-07-14 14:22:54', '2026-07-14 14:22:54', NULL, NULL, NULL, NULL, 0, NULL, NULL, 1, NULL) ON DUPLICATE KEY UPDATE `openId` = VALUES(`openId`), `name` = VALUES(`name`), `email` = VALUES(`email`), `loginMethod` = VALUES(`loginMethod`), `role` = VALUES(`role`), `createdAt` = VALUES(`createdAt`), `updatedAt` = VALUES(`updatedAt`), `lastSignedIn` = VALUES(`lastSignedIn`), `phone` = VALUES(`phone`), `department` = VALUES(`department`), `schoolLocation` = VALUES(`schoolLocation`), `approvalPin` = VALUES(`approvalPin`), `failedLoginAttempts` = VALUES(`failedLoginAttempts`), `lockedUntil` = VALUES(`lockedUntil`), `lastActivity` = VALUES(`lastActivity`), `isActive` = VALUES(`isActive`), `schoolId` = VALUES(`schoolId`);

SET FOREIGN_KEY_CHECKS = 1;