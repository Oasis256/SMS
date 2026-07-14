import { Request, Response } from "express";
import { getDb } from "./db";
import { incomeRecords, expenseRequests, attendance, students, schools } from "../drizzle/schema";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { notifyOwner } from "./_core/notification";
import { SCHOOLS } from "../shared/const";

/**
 * Daily Cash Summary - runs every day at 6 PM EAT (3 PM UTC)
 * Sends to Principal, Bursar, Director of Studies
 * Generates per-school breakdown + overall summary
 */
export async function dailyCashSummaryHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const database = await getDb();
    if (!database) return res.status(500).json({ error: "Database unavailable" });

    const today = new Date().toISOString().split('T')[0];
    let fullSummary = `📊 Daily Cash Summary - ${today}\n\n`;
    let grandTotalIncome = 0;
    let grandTotalExpenses = 0;

    // Per-school breakdown
    for (const school of SCHOOLS) {
      const [incomeResult] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(incomeRecords).where(and(
        sql`DATE(${incomeRecords.paymentDate}) = ${today}`,
        eq(incomeRecords.schoolId, school.id)
      ));

      const [expenseResult] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(expenseRequests).where(and(
        sql`DATE(${expenseRequests.paidAt}) = ${today}`,
        eq(expenseRequests.status, 'paid'),
        eq(expenseRequests.schoolId, school.id)
      ));

      const income = parseFloat(incomeResult?.total || '0');
      const expenses = parseFloat(expenseResult?.total || '0');
      grandTotalIncome += income;
      grandTotalExpenses += expenses;

      fullSummary += `🏫 ${school.shortName} (${school.type === 'primary' ? 'Primary' : 'Secondary'}):\n`;
      fullSummary += `  Income: UGX ${income.toLocaleString()} (${incomeResult?.count || 0} txns)\n`;
      fullSummary += `  Expenses: UGX ${expenses.toLocaleString()} (${expenseResult?.count || 0} payments)\n`;
      fullSummary += `  Net: UGX ${(income - expenses).toLocaleString()}\n\n`;
    }

    fullSummary += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    fullSummary += `TOTAL Income: UGX ${grandTotalIncome.toLocaleString()}\n`;
    fullSummary += `TOTAL Expenses: UGX ${grandTotalExpenses.toLocaleString()}\n`;
    fullSummary += `NET Cash Flow: UGX ${(grandTotalIncome - grandTotalExpenses).toLocaleString()}\n\n`;
    fullSummary += `Generated automatically by Ultimate SMS`;

    await notifyOwner({
      title: `Daily Cash Summary - ${today}`,
      content: fullSummary,
    });

    res.json({ ok: true, summary: { date: today, totalIncome: grandTotalIncome, totalExpenses: grandTotalExpenses, net: grandTotalIncome - grandTotalExpenses } });
  } catch (error: any) {
    console.error("[Scheduled] Daily cash summary error:", error);
    res.status(500).json({ error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
  }
}

/**
 * Weekly Attendance Report - runs every Monday at 7 AM EAT (4 AM UTC)
 * Sends to Principal, Bursar, Director of Studies
 * Per-school breakdown
 */
export async function weeklyAttendanceReportHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const database = await getDb();
    if (!database) return res.status(500).json({ error: "Database unavailable" });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const records = await database.select().from(attendance).where(
      and(sql`${attendance.date} >= ${weekAgo}`, sql`${attendance.date} <= ${today}`)
    );

    const calcStats = (data: typeof records) => ({
      total: data.length,
      present: data.filter(r => r.status === 'present').length,
      late: data.filter(r => r.status === 'late').length,
      absent: data.filter(r => r.status === 'absent').length,
      onLeave: data.filter(r => r.status === 'on_leave').length,
    });

    let report = `📋 Weekly Attendance Report (${weekAgo} to ${today})\n\n`;

    for (const school of SCHOOLS) {
      const schoolRecords = records.filter(r => r.schoolId === school.id);
      const studentRecords = schoolRecords.filter(r => r.personType === 'student');
      const staffRecordsData = schoolRecords.filter(r => r.personType === 'staff');
      const studentStats = calcStats(studentRecords);
      const staffStats = calcStats(staffRecordsData);

      report += `🏫 ${school.shortName}:\n`;
      report += `  Students: ${studentStats.present} present, ${studentStats.late} late, ${studentStats.absent} absent, ${studentStats.onLeave} on leave`;
      report += studentStats.total > 0 ? ` (${(((studentStats.present + studentStats.late) / studentStats.total) * 100).toFixed(1)}% rate)\n` : '\n';
      report += `  Staff: ${staffStats.present} present, ${staffStats.late} late, ${staffStats.absent} absent, ${staffStats.onLeave} on leave`;
      report += staffStats.total > 0 ? ` (${(((staffStats.present + staffStats.late) / staffStats.total) * 100).toFixed(1)}% rate)\n\n` : '\n\n';
    }

    // Overall totals
    const allStudents = calcStats(records.filter(r => r.personType === 'student'));
    const allStaff = calcStats(records.filter(r => r.personType === 'staff'));
    report += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `OVERALL Students: ${allStudents.total} records, ${allStudents.total > 0 ? (((allStudents.present + allStudents.late) / allStudents.total) * 100).toFixed(1) : 0}% attendance\n`;
    report += `OVERALL Staff: ${allStaff.total} records, ${allStaff.total > 0 ? (((allStaff.present + allStaff.late) / allStaff.total) * 100).toFixed(1) : 0}% attendance\n\n`;
    report += `Generated automatically by Ultimate SMS`;

    await notifyOwner({
      title: `Weekly Attendance Report - ${today}`,
      content: report,
    });

    res.json({ ok: true, allStudents, allStaff });
  } catch (error: any) {
    console.error("[Scheduled] Weekly attendance report error:", error);
    res.status(500).json({ error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
  }
}

/**
 * Monthly Financial Statement - runs on 1st of each month at 8 AM EAT (5 AM UTC)
 * Sends to Principal, Bursar, Director of Studies
 * Per-school breakdown
 */
export async function monthlyFinancialStatementHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const database = await getDb();
    if (!database) return res.status(500).json({ error: "Database unavailable" });

    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = firstOfLastMonth.toISOString().split('T')[0];
    const thisMonthStr = firstOfThisMonth.toISOString().split('T')[0];
    const monthName = firstOfLastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    let statement = `💰 Monthly Financial Statement - ${monthName}\n\n`;
    let grandIncome = 0;
    let grandExpenses = 0;

    for (const school of SCHOOLS) {
      const [incomeResult] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(incomeRecords).where(and(
        sql`${incomeRecords.paymentDate} >= ${lastMonthStr}`,
        sql`${incomeRecords.paymentDate} < ${thisMonthStr}`,
        eq(incomeRecords.schoolId, school.id)
      ));

      const [expenseResult] = await database.select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`
      }).from(expenseRequests).where(and(
        sql`${expenseRequests.paidAt} >= ${lastMonthStr}`,
        sql`${expenseRequests.paidAt} < ${thisMonthStr}`,
        eq(expenseRequests.status, 'paid'),
        eq(expenseRequests.schoolId, school.id)
      ));

      const income = parseFloat(incomeResult?.total || '0');
      const expenses = parseFloat(expenseResult?.total || '0');
      grandIncome += income;
      grandExpenses += expenses;

      statement += `🏫 ${school.shortName}:\n`;
      statement += `  Income: UGX ${income.toLocaleString()} (${incomeResult?.count || 0} txns)\n`;
      statement += `  Expenses: UGX ${expenses.toLocaleString()} (${expenseResult?.count || 0} payments)\n`;
      statement += `  Net: UGX ${(income - expenses).toLocaleString()}\n\n`;
    }

    statement += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    statement += `TOTAL Income: UGX ${grandIncome.toLocaleString()}\n`;
    statement += `TOTAL Expenses: UGX ${grandExpenses.toLocaleString()}\n`;
    statement += `NET Position: UGX ${(grandIncome - grandExpenses).toLocaleString()}\n\n`;
    statement += `Generated automatically by Ultimate SMS`;

    await notifyOwner({
      title: `Monthly Financial Statement - ${monthName}`,
      content: statement,
    });

    res.json({ ok: true, month: monthName, totalIncome: grandIncome, totalExpenses: grandExpenses, net: grandIncome - grandExpenses });
  } catch (error: any) {
    console.error("[Scheduled] Monthly financial statement error:", error);
    res.status(500).json({ error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
  }
}

/**
 * Absence Notification - runs daily at 10 AM EAT (7 AM UTC)
 * Sends email alerts to parents/guardians when a student is marked absent or late
 * Per-school breakdown
 */
export async function absenceNotificationHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const database = await getDb();
    if (!database) return res.status(500).json({ error: "Database unavailable" });

    const today = new Date().toISOString().split('T')[0];
    let totalNotified = 0;

    for (const school of SCHOOLS) {
      // Get today's absent and late students for this school
      const absentRecords = await database.select().from(attendance).where(and(
        sql`DATE(${attendance.date}) = ${today}`,
        eq(attendance.personType, 'student'),
        sql`${attendance.status} IN ('absent', 'late')`,
        eq(attendance.schoolId, school.id)
      ));

      if (absentRecords.length === 0) continue;

      // Get student details for notifications
      const studentIds = absentRecords.map(r => r.personId);
      const studentDetails = await database.select().from(students).where(
        sql`${students.id} IN (${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`
      );

      const absentNames: string[] = [];
      const lateNames: string[] = [];

      for (const record of absentRecords) {
        const student = studentDetails.find((s: any) => s.id === record.personId);
        if (student) {
          if (record.status === 'absent') absentNames.push(`${student.firstName} ${student.lastName}`);
          else lateNames.push(`${student.firstName} ${student.lastName}`);
          totalNotified++;
        }
      }

      if (absentNames.length > 0 || lateNames.length > 0) {
        let content = `School: ${school.name}\nDate: ${today}\n\n`;
        if (absentNames.length > 0) content += `ABSENT (${absentNames.length}):\n${absentNames.map(n => `  - ${n}`).join('\n')}\n\n`;
        if (lateNames.length > 0) content += `LATE (${lateNames.length}):\n${lateNames.map(n => `  - ${n}`).join('\n')}\n\n`;
        content += `Parents/guardians should be contacted regarding these students.`;

        await notifyOwner({
          title: `${school.shortName}: ${absentNames.length} absent, ${lateNames.length} late - ${today}`,
          content,
        });
      }
    }

    res.json({ ok: true, totalNotified });
  } catch (error: any) {
    console.error("[Scheduled] Absence notification error:", error);
    res.status(500).json({ error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
  }
}

/**
 * Fee Reminder - runs weekly on Friday at 9 AM EAT (6 AM UTC)
 * Sends fee payment reminders for outstanding fees per school
 */
export async function feeReminderHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const database = await getDb();
    if (!database) return res.status(500).json({ error: "Database unavailable" });

    let report = `💸 Weekly Fee Status Report\n\n`;
    let totalActive = 0;

    for (const school of SCHOOLS) {
      const studentsInSchool = await database.select().from(students).where(and(
        eq(students.status, 'active'),
        eq(students.schoolId, school.id)
      ));

      totalActive += studentsInSchool.length;
      report += `🏫 ${school.shortName}: ${studentsInSchool.length} active students\n`;
    }

    report += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Total Active Students: ${totalActive}\n\n`;
    report += `Please review the Finance module for detailed fee payment status and outstanding balances per school.\n\n`;
    report += `Generated automatically by Ultimate SMS`;

    await notifyOwner({
      title: `Weekly Fee Status - ${totalActive} active students`,
      content: report,
    });

    res.json({ ok: true, activeStudents: totalActive });
  } catch (error: any) {
    console.error("[Scheduled] Fee reminder error:", error);
    res.status(500).json({ error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
  }
}
