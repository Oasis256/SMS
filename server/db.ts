import { eq, and, desc, sql, gte, lte, like, or, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, students, attendance, expenseRequests, incomeRecords, budgets, payroll, classes, subjects, grades, lessonPlans, timetable, staffRecords, leaveRequests, disciplineRecords, auditLogs, academicCalendar, notifications, schools } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ STUDENT QUERIES ============
export async function getAllStudents(filters?: { schoolId?: number; classId?: number; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.schoolId && filters.schoolId > 0) conditions.push(eq(students.schoolId, filters.schoolId));
  if (filters?.classId) conditions.push(eq(students.classId, filters.classId));
  if (filters?.status) conditions.push(eq(students.status, filters.status as any));
  if (filters?.search) {
    conditions.push(or(
      like(students.firstName, `%${filters.search}%`),
      like(students.lastName, `%${filters.search}%`),
      like(students.studentId, `%${filters.search}%`)
    ));
  }
  if (conditions.length > 0) {
    return db.select().from(students).where(and(...conditions)).orderBy(desc(students.createdAt));
  }
  return db.select().from(students).orderBy(desc(students.createdAt));
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0];
}

// ============ ATTENDANCE QUERIES ============
export async function getAttendanceByDate(date: string, personType?: string, schoolId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [sql`${attendance.date} = ${date}`];
  if (personType) conditions.push(eq(attendance.personType, personType as any));
  if (schoolId && schoolId > 0) conditions.push(eq(attendance.schoolId, schoolId));
  return db.select().from(attendance).where(and(...conditions));
}

export async function getTodayAttendanceSummary(schoolId?: number) {
  const db = await getDb();
  if (!db) return { present: 0, late: 0, absent: 0, onLeave: 0, offCampus: 0, total: 0 };
  const today = new Date().toISOString().split('T')[0];
  const conditions = [sql`${attendance.date} = ${today}`];
  if (schoolId && schoolId > 0) conditions.push(eq(attendance.schoolId, schoolId));
  const records = await db.select().from(attendance).where(and(...conditions));
  return {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    onLeave: records.filter(r => r.status === 'on_leave').length,
    offCampus: records.filter(r => r.status === 'off_campus').length,
    total: records.length,
  };
}

// ============ FINANCE QUERIES ============
export async function getExpenseRequests(status?: string, schoolId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (status) conditions.push(eq(expenseRequests.status, status as any));
  if (schoolId && schoolId > 0) conditions.push(eq(expenseRequests.schoolId, schoolId));
  if (conditions.length > 0) {
    return db.select().from(expenseRequests).where(and(...conditions)).orderBy(desc(expenseRequests.createdAt));
  }
  return db.select().from(expenseRequests).orderBy(desc(expenseRequests.createdAt));
}

export async function getIncomeRecords(filters?: { category?: string; startDate?: string; endDate?: string; schoolId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.category) conditions.push(eq(incomeRecords.category, filters.category as any));
  if (filters?.startDate) conditions.push(sql`${incomeRecords.paymentDate} >= ${filters.startDate}`);
  if (filters?.endDate) conditions.push(sql`${incomeRecords.paymentDate} <= ${filters.endDate}`);
  if (filters?.schoolId && filters.schoolId > 0) conditions.push(eq(incomeRecords.schoolId, filters.schoolId));
  if (conditions.length > 0) {
    return db.select().from(incomeRecords).where(and(...conditions)).orderBy(desc(incomeRecords.createdAt));
  }
  return db.select().from(incomeRecords).orderBy(desc(incomeRecords.createdAt));
}

export async function getBudgets(academicYear?: string, schoolId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (academicYear) conditions.push(eq(budgets.academicYear, academicYear));
  if (schoolId && schoolId > 0) conditions.push(eq(budgets.schoolId, schoolId));
  if (conditions.length > 0) {
    return db.select().from(budgets).where(and(...conditions));
  }
  return db.select().from(budgets);
}

// ============ STAFF QUERIES ============
export async function getAllStaff(schoolId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (schoolId && schoolId > 0) {
    return db.select().from(staffRecords).where(eq(staffRecords.schoolId, schoolId)).orderBy(desc(staffRecords.createdAt));
  }
  return db.select().from(staffRecords).orderBy(desc(staffRecords.createdAt));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ============ CLASS QUERIES ============
export async function getAllClasses(schoolId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (schoolId && schoolId > 0) {
    return db.select().from(classes).where(eq(classes.schoolId, schoolId));
  }
  return db.select().from(classes);
}

// ============ SUBJECT QUERIES ============
export async function getAllSubjects(schoolId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (schoolId && schoolId > 0) {
    return db.select().from(subjects).where(eq(subjects.schoolId, schoolId));
  }
  return db.select().from(subjects);
}

// ============ AUDIT LOG ============
export async function createAuditLog(entry: { userId?: number; action: string; tableName?: string; recordId?: number; oldValue?: string; newValue?: string; ipAddress?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(entry);
}

// ============ GRADES ============
export async function getGradesByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(grades).where(eq(grades.studentId, studentId));
}

// ============ LEAVE REQUESTS ============
export async function getLeaveRequests(status?: string) {
  const database = await getDb();
  if (!database) return [];
  if (status) {
    return database.select().from(leaveRequests).where(eq(leaveRequests.status, status as any)).orderBy(desc(leaveRequests.createdAt));
  }
  return database.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt));
}

// ============ PAYROLL ============
export async function getPayrollByMonth(month: string, schoolId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(payroll.month, month)];
  if (schoolId && schoolId > 0) conditions.push(eq(payroll.schoolId, schoolId));
  return db.select().from(payroll).where(and(...conditions));
}

// ============ DASHBOARD STATS ============
export async function getDashboardStats(schoolId?: number) {
  const db = await getDb();
  if (!db) return { totalStudents: 0, totalStaff: 0, totalClasses: 0, pendingExpenses: 0 };
  const studentConditions = [eq(students.status, 'active')];
  const staffConditions = [eq(staffRecords.status, 'active')];
  const classConditions: any[] = [];
  const expenseConditions = [or(eq(expenseRequests.status, 'pending'), eq(expenseRequests.status, 'finance_reviewed'))!];
  if (schoolId && schoolId > 0) {
    studentConditions.push(eq(students.schoolId, schoolId));
    staffConditions.push(eq(staffRecords.schoolId, schoolId));
    classConditions.push(eq(classes.schoolId, schoolId));
    expenseConditions.push(eq(expenseRequests.schoolId, schoolId));
  }
  const [studentCount] = await db.select({ count: count() }).from(students).where(and(...studentConditions));
  const [staffCount] = await db.select({ count: count() }).from(staffRecords).where(and(...staffConditions));
  const [classCount] = classConditions.length > 0
    ? await db.select({ count: count() }).from(classes).where(and(...classConditions))
    : await db.select({ count: count() }).from(classes);
  const [expenseCount] = await db.select({ count: count() }).from(expenseRequests).where(and(...expenseConditions));
  return {
    totalStudents: studentCount?.count ?? 0,
    totalStaff: staffCount?.count ?? 0,
    totalClasses: classCount?.count ?? 0,
    pendingExpenses: expenseCount?.count ?? 0,
  };
}
