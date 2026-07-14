import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean, decimal, date } from "drizzle-orm/mysql-core";

// ============================================================
// SCHOOLS TABLE - Three independent schools under one management
// ============================================================
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  shortName: varchar("shortName", { length: 50 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  type: mysqlEnum("type", ["primary", "secondary"]).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  principalName: varchar("principalName", { length: 200 }),
  motto: varchar("motto", { length: 300 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

// ============================================================
// USERS TABLE - Extended with school-specific roles
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "principal", "bursar", "director_of_studies", "teacher", "department_head"]).default("user").notNull(),
  phone: varchar("phone", { length: 20 }),
  department: varchar("department", { length: 100 }),
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator"]), // legacy, kept for compat
  approvalPin: varchar("approvalPin", { length: 255 }),
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  lastActivity: timestamp("lastActivity"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// STUDENTS TABLE
// ============================================================
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  studentId: varchar("studentId", { length: 20 }).notNull().unique(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  dateOfBirth: date("dateOfBirth"),
  gender: mysqlEnum("gender", ["male", "female"]),
  photoUrl: text("photoUrl"),
  // Contact info
  homeAddress: text("homeAddress"),
  parentName: varchar("parentName", { length: 200 }),
  parentPhone: varchar("parentPhone", { length: 20 }),
  parentEmail: varchar("parentEmail", { length: 320 }),
  emergencyContact: varchar("emergencyContact", { length: 20 }),
  // Enrollment details
  admissionDate: date("admissionDate"),
  classId: int("classId"),
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator"]), // legacy
  studentType: mysqlEnum("studentType", ["day", "boarding"]),
  feeCategory: mysqlEnum("feeCategory", ["primary", "secondary", "olevel", "alevel"]),
  // Sponsor info
  sponsorName: varchar("sponsorName", { length: 200 }),
  sponsorContact: varchar("sponsorContact", { length: 200 }),
  sponsorAmount: decimal("sponsorAmount", { precision: 12, scale: 2 }),
  sponsorStartDate: date("sponsorStartDate"),
  sponsorStatus: mysqlEnum("sponsorStatus", ["active", "inactive", "pending"]),
  // Special needs
  hasSpecialNeeds: boolean("hasSpecialNeeds").default(false),
  specialNeedsNotes: text("specialNeedsNotes"),
  medicalConditions: text("medicalConditions"),
  // Status
  status: mysqlEnum("status", ["active", "graduated", "transferred", "suspended", "withdrawn"]).default("active").notNull(),
  biometricId: varchar("biometricId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ============================================================
// CLASSES TABLE
// ============================================================
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  gradeLevel: varchar("gradeLevel", { length: 20 }).notNull(),
  section: varchar("section", { length: 10 }),
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator"]), // legacy
  classTeacherId: int("classTeacherId"),
  capacity: int("capacity").default(40),
  academicYear: varchar("academicYear", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

// ============================================================
// SUBJECTS TABLE
// ============================================================
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  department: varchar("department", { length: 100 }),
  gradeLevel: varchar("gradeLevel", { length: 20 }),
  schoolId: int("schoolId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

// ============================================================
// ATTENDANCE TABLE (Biometric)
// ============================================================
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  personType: mysqlEnum("personType", ["student", "staff"]).notNull(),
  personId: int("personId").notNull(),
  date: date("date").notNull(),
  clockIn: timestamp("clockIn"),
  clockOut: timestamp("clockOut"),
  status: mysqlEnum("status", ["present", "late", "absent", "on_leave", "off_campus"]).default("absent").notNull(),
  location: mysqlEnum("location", ["main_entrance", "dormitory", "mess", "staff_room", "admin_office"]),
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator"]), // legacy
  biometricVerified: boolean("biometricVerified").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

// ============================================================
// FINANCE - INCOME TABLE
// ============================================================
export const incomeRecords = mysqlTable("incomeRecords", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["sponsorship", "student_fees", "facility_rental", "meal_sales", "training_fees", "agricultural_sales", "donations", "grants", "other"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 5 }).default("UGX").notNull(),
  description: text("description"),
  payerName: varchar("payerName", { length: 200 }),
  payerContact: varchar("payerContact", { length: 200 }),
  studentId: int("studentId"),
  receiptNumber: varchar("receiptNumber", { length: 50 }),
  paymentDate: date("paymentDate").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "bank_transfer", "mobile_money", "cheque"]),
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator"]), // legacy
  recordedBy: int("recordedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IncomeRecord = typeof incomeRecords.$inferSelect;
export type InsertIncomeRecord = typeof incomeRecords.$inferInsert;

// ============================================================
// FINANCE - EXPENSE REQUESTS TABLE (with approval workflow)
// ============================================================
export const expenseRequests = mysqlTable("expenseRequests", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 5 }).default("UGX").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  supportingDocs: text("supportingDocs"),
  // Workflow status
  status: mysqlEnum("status", ["pending", "finance_reviewed", "principal_approved", "rejected", "paid", "cancelled"]).default("pending").notNull(),
  // Requester
  requestedBy: int("requestedBy").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  // Finance review
  financeReviewedBy: int("financeReviewedBy"),
  financeReviewedAt: timestamp("financeReviewedAt"),
  financeNotes: text("financeNotes"),
  budgetVerified: boolean("budgetVerified").default(false),
  fundsAvailable: boolean("fundsAvailable").default(false),
  // Principal approval
  principalApprovedBy: int("principalApprovedBy"),
  principalApprovedAt: timestamp("principalApprovedAt"),
  principalNotes: text("principalNotes"),
  approvalPin: varchar("approvalPin", { length: 255 }),
  // Payment
  paidBy: int("paidBy"),
  paidAt: timestamp("paidAt"),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "bank_transfer", "mobile_money", "cheque"]),
  paymentReference: varchar("paymentReference", { length: 100 }),
  // Metadata
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator"]), // legacy
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpenseRequest = typeof expenseRequests.$inferSelect;
export type InsertExpenseRequest = typeof expenseRequests.$inferInsert;

// ============================================================
// FINANCE - BUDGET TABLE
// ============================================================
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  allocatedAmount: decimal("allocatedAmount", { precision: 15, scale: 2 }).notNull(),
  spentAmount: decimal("spentAmount", { precision: 15, scale: 2 }).default("0").notNull(),
  academicYear: varchar("academicYear", { length: 10 }).notNull(),
  term: mysqlEnum("term", ["term1", "term2", "term3"]),
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator"]), // legacy
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

// ============================================================
// PAYROLL TABLE
// ============================================================
export const payroll = mysqlTable("payroll", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  baseSalary: decimal("baseSalary", { precision: 12, scale: 2 }).notNull(),
  attendanceBonus: decimal("attendanceBonus", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  netSalary: decimal("netSalary", { precision: 12, scale: 2 }).notNull(),
  daysWorked: int("daysWorked").default(0),
  daysAbsent: int("daysAbsent").default(0),
  lateArrivals: int("lateArrivals").default(0),
  status: mysqlEnum("status", ["draft", "approved", "paid"]).default("draft").notNull(),
  schoolId: int("schoolId"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = typeof payroll.$inferInsert;

// ============================================================
// GRADES TABLE
// ============================================================
export const grades = mysqlTable("grades", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  term: mysqlEnum("term", ["term1", "term2", "term3"]).notNull(),
  academicYear: varchar("academicYear", { length: 10 }).notNull(),
  assessmentType: mysqlEnum("assessmentType", ["continuous", "midterm", "final"]).notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("maxScore", { precision: 5, scale: 2 }).default("100"),
  grade: varchar("grade", { length: 5 }),
  remarks: text("remarks"),
  enteredBy: int("enteredBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

// ============================================================
// LESSON PLANS TABLE
// ============================================================
export const lessonPlans = mysqlTable("lessonPlans", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  subjectId: int("subjectId").notNull(),
  classId: int("classId").notNull(),
  date: date("date").notNull(),
  topic: varchar("topic", { length: 200 }).notNull(),
  objectives: text("objectives"),
  content: text("content"),
  activities: text("activities"),
  resources: text("resources"),
  assessment: text("assessment"),
  status: mysqlEnum("status", ["draft", "submitted", "approved"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LessonPlan = typeof lessonPlans.$inferSelect;
export type InsertLessonPlan = typeof lessonPlans.$inferInsert;

// ============================================================
// TIMETABLE TABLE
// ============================================================
export const timetable = mysqlTable("timetable", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  subjectId: int("subjectId").notNull(),
  teacherId: int("teacherId").notNull(),
  dayOfWeek: mysqlEnum("dayOfWeek", ["monday", "tuesday", "wednesday", "thursday", "friday"]).notNull(),
  period: int("period").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  term: mysqlEnum("term", ["term1", "term2", "term3"]).notNull(),
  academicYear: varchar("academicYear", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Timetable = typeof timetable.$inferSelect;
export type InsertTimetable = typeof timetable.$inferInsert;

// ============================================================
// STAFF RECORDS TABLE (HR)
// ============================================================
export const staffRecords = mysqlTable("staffRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  employeeId: varchar("employeeId", { length: 20 }).notNull().unique(),
  position: varchar("position", { length: 100 }),
  department: varchar("department", { length: 100 }),
  qualification: text("qualification"),
  dateOfJoining: date("dateOfJoining"),
  contractType: mysqlEnum("contractType", ["permanent", "contract", "temporary"]),
  baseSalary: decimal("baseSalary", { precision: 12, scale: 2 }),
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator"]), // legacy
  biometricId: varchar("biometricId", { length: 64 }),
  status: mysqlEnum("status", ["active", "on_leave", "terminated", "retired"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StaffRecord = typeof staffRecords.$inferSelect;
export type InsertStaffRecord = typeof staffRecords.$inferInsert;

// ============================================================
// LEAVE REQUESTS TABLE
// ============================================================
export const leaveRequests = mysqlTable("leaveRequests", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  leaveType: mysqlEnum("leaveType", ["annual", "sick", "compassionate", "maternity", "paternity", "professional_development"]).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

// ============================================================
// DISCIPLINE RECORDS TABLE
// ============================================================
export const disciplineRecords = mysqlTable("disciplineRecords", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  incidentDate: date("incidentDate").notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["minor", "moderate", "major"]).notNull(),
  actionTaken: text("actionTaken"),
  reportedBy: int("reportedBy"),
  status: mysqlEnum("status", ["open", "resolved", "escalated"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DisciplineRecord = typeof disciplineRecords.$inferSelect;
export type InsertDisciplineRecord = typeof disciplineRecords.$inferInsert;

// ============================================================
// AUDIT LOG TABLE
// ============================================================
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  tableName: varchar("tableName", { length: 100 }),
  recordId: int("recordId"),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================
// ACADEMIC CALENDAR TABLE
// ============================================================
export const academicCalendar = mysqlTable("academicCalendar", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  eventType: mysqlEnum("eventType", ["term_start", "term_end", "holiday", "exam", "meeting", "event"]).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  description: text("description"),
  schoolId: int("schoolId"),
  schoolLocation: mysqlEnum("schoolLocation", ["kabale", "equator", "all"]), // legacy
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AcademicCalendarEvent = typeof academicCalendar.$inferSelect;
export type InsertAcademicCalendarEvent = typeof academicCalendar.$inferInsert;

// ============================================================
// NOTIFICATIONS TABLE (for email alerts)
// ============================================================
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientType: mysqlEnum("recipientType", ["parent", "sponsor", "staff"]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 20 }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  notificationType: mysqlEnum("notificationType", ["absence_alert", "late_alert", "fee_reminder", "general"]).notNull(),
  relatedStudentId: int("relatedStudentId"),
  sent: boolean("sent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
