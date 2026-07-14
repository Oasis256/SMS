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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(20) NOT NULL,
	`department` varchar(100),
	`gradeLevel` varchar(20),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','principal','bursar','director_of_studies','teacher','department_head') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `schoolLocation` enum('kabale','equator');--> statement-breakpoint
ALTER TABLE `users` ADD `approvalPin` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `failedLoginAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lockedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `lastActivity` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;