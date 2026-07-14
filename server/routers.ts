import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, financeProcedure, principalProcedure, teacherProcedure, hrProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { students, attendance, expenseRequests, incomeRecords, budgets, payroll, classes, subjects, grades, lessonPlans, timetable, staffRecords, leaveRequests, disciplineRecords, auditLogs, academicCalendar, notifications, users } from "../drizzle/schema";
import { eq, desc, and, sql, or, like, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { schools } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure.input(z.object({ schoolId: z.number() }).optional()).query(async ({ input }) => {
      return db.getDashboardStats(input?.schoolId);
    }),
    attendanceSummary: protectedProcedure.input(z.object({ schoolId: z.number() }).optional()).query(async ({ input }) => {
      return db.getTodayAttendanceSummary(input?.schoolId);
    }),
    recentExpenses: protectedProcedure.input(z.object({ schoolId: z.number() }).optional()).query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];
      const conditions = [];
      if (input?.schoolId && input.schoolId > 0) {
        conditions.push(eq(expenseRequests.schoolId, input.schoolId));
      }
      if (conditions.length > 0) {
        return database.select().from(expenseRequests).where(and(...conditions)).orderBy(desc(expenseRequests.createdAt)).limit(5);
      }
      return database.select().from(expenseRequests).orderBy(desc(expenseRequests.createdAt)).limit(5);
    }),
    schools: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database.select().from(schools);
    }),
  }),

  // ============ USERS / ROLES ============
  users: router({
    list: protectedProcedure.query(async () => {
      return db.getAllUsers();
    }),
    updateRole: principalProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(['user', 'admin', 'principal', 'bursar', 'director_of_studies', 'teacher', 'department_head']),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      await db.createAuditLog({ userId: ctx.user.id, action: 'update_role', tableName: 'users', recordId: input.userId, newValue: input.role });
      return { success: true };
    }),
    setApprovalPin: principalProcedure.input(z.object({
      pin: z.string().min(4).max(6),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(users).set({ approvalPin: input.pin }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
  }),

  // ============ STUDENTS ============
  students: router({
    list: protectedProcedure.input(z.object({
      search: z.string().optional(),
      schoolId: z.number().optional(),
      classId: z.number().optional(),
      status: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return db.getAllStudents({ ...input, schoolId: input?.schoolId });
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getStudentById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      dateOfBirth: z.string().optional(),
      gender: z.enum(['male', 'female']).optional(),
      homeAddress: z.string().optional(),
      parentName: z.string().optional(),
      parentPhone: z.string().optional(),
      parentEmail: z.string().optional(),
      emergencyContact: z.string().optional(),
      schoolId: z.number().optional(),
      studentType: z.enum(['day', 'boarding']).optional(),
      feeCategory: z.enum(['primary', 'secondary', 'olevel', 'alevel']).optional(),
      classId: z.number().optional(),
      sponsorName: z.string().optional(),
      sponsorContact: z.string().optional(),
      sponsorAmount: z.string().optional(),
      sponsorStatus: z.enum(['active', 'inactive', 'pending']).optional(),
      hasSpecialNeeds: z.boolean().optional(),
      specialNeedsNotes: z.string().optional(),
      medicalConditions: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const studentId = `STU-${Date.now().toString(36).toUpperCase()}`;
     await database.insert(students).values({
       studentId,
       firstName: input.firstName,
       lastName: input.lastName,
        dateOfBirth: input.dateOfBirth as any,
       gender: input.gender,
       homeAddress: input.homeAddress,
       parentName: input.parentName,
       parentPhone: input.parentPhone,
       parentEmail: input.parentEmail,
       emergencyContact: input.emergencyContact,
       schoolId: input.schoolId,
       studentType: input.studentType,
       feeCategory: input.feeCategory,
       classId: input.classId,
       sponsorName: input.sponsorName,
       sponsorContact: input.sponsorContact,
       sponsorAmount: input.sponsorAmount,
       sponsorStatus: input.sponsorStatus,
       hasSpecialNeeds: input.hasSpecialNeeds,
       specialNeedsNotes: input.specialNeedsNotes,
       medicalConditions: input.medicalConditions,
        admissionDate: new Date().toISOString().split('T')[0] as any,
     });
      await db.createAuditLog({ userId: ctx.user.id, action: 'create_student', tableName: 'students', newValue: JSON.stringify({ studentId, name: `${input.firstName} ${input.lastName}` }) });
      return { success: true, studentId };
    }),
    update: protectedProcedure.input(z.object({
     id: z.number(),
      data: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        parentName: z.string().optional(),
        parentPhone: z.string().optional(),
        parentEmail: z.string().optional(),
        schoolId: z.number().optional(),
        classId: z.number().optional(),
        status: z.enum(['active', 'graduated', 'transferred', 'suspended', 'withdrawn']).optional(),
        sponsorName: z.string().optional(),
        sponsorContact: z.string().optional(),
        sponsorAmount: z.string().optional(),
        sponsorStatus: z.enum(['active', 'inactive', 'pending']).optional(),
      }),
   })).mutation(async ({ input, ctx }) => {
     const database = await getDb();
     if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updateData: Record<string, any> = {};
      Object.entries(input.data).forEach(([key, value]) => {
        if (value !== undefined) updateData[key] = value;
      });
      if (Object.keys(updateData).length > 0) {
        await database.update(students).set(updateData).where(eq(students.id, input.id));
      }
     await db.createAuditLog({ userId: ctx.user.id, action: 'update_student', tableName: 'students', recordId: input.id });
     return { success: true };
   }),
  }),

  // ============ ATTENDANCE ============
  attendance: router({
    getByDate: protectedProcedure.input(z.object({
      date: z.string(),
      personType: z.string().optional(),
      schoolId: z.number().optional(),
    })).query(async ({ input }) => {
      return db.getAttendanceByDate(input.date, input.personType, input.schoolId);
    }),
    summary: protectedProcedure.input(z.object({ schoolId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.getTodayAttendanceSummary(input?.schoolId);
    }),
    record: protectedProcedure.input(z.object({
     personType: z.enum(['student', 'staff']),
     personId: z.number(),
     date: z.string(),
     status: z.enum(['present', 'late', 'absent', 'on_leave', 'off_campus']),
     clockIn: z.string().optional(),
     clockOut: z.string().optional(),
     location: z.enum(['main_entrance', 'dormitory', 'mess', 'staff_room', 'admin_office']).optional(),
     schoolId: z.number().optional(),
     biometricVerified: z.boolean().optional(),
     notes: z.string().optional(),
   })).mutation(async ({ input, ctx }) => {
     const database = await getDb();
     if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
     await database.insert(attendance).values({
       personType: input.personType,
       personId: input.personId,
        date: input.date as any,
       status: input.status,
       clockIn: input.clockIn ? new Date(input.clockIn) : undefined,
       clockOut: input.clockOut ? new Date(input.clockOut) : undefined,
       location: input.location,
       schoolId: input.schoolId,
      biometricVerified: input.biometricVerified,
      notes: input.notes,
    });
     await db.createAuditLog({ userId: ctx.user.id, action: 'record_attendance', tableName: 'attendance', newValue: JSON.stringify({ personType: input.personType, personId: input.personId, status: input.status }) });
     return { success: true };
   }),
   bulkRecord: protectedProcedure.input(z.object({
     records: z.array(z.object({
       personType: z.enum(['student', 'staff']),
       personId: z.number(),
       date: z.string(),
       status: z.enum(['present', 'late', 'absent', 'on_leave', 'off_campus']),
       clockIn: z.string().optional(),
       biometricVerified: z.boolean().optional(),
       schoolId: z.number().optional(),
     })),
   })).mutation(async ({ input }) => {
     const database = await getDb();
     if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
     for (const record of input.records) {
       await database.insert(attendance).values({
         personType: record.personType,
         personId: record.personId,
          date: record.date as any,
         status: record.status,
         clockIn: record.clockIn ? new Date(record.clockIn) : undefined,
         biometricVerified: record.biometricVerified,
         schoolId: record.schoolId,
       });
     }
      return { success: true };
   }),
 }),

  // ============ FINANCE ============
  finance: router({
    // Income
    incomeList: financeProcedure.input(z.object({
      category: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      schoolId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return db.getIncomeRecords({ ...input, schoolId: input?.schoolId });
    }),
    recordIncome: financeProcedure.input(z.object({
     category: z.enum(['sponsorship', 'student_fees', 'facility_rental', 'meal_sales', 'training_fees', 'agricultural_sales', 'donations', 'grants', 'other']),
     amount: z.string(),
     description: z.string().optional(),
     payerName: z.string().optional(),
     payerContact: z.string().optional(),
     studentId: z.number().optional(),
     paymentDate: z.string(),
     paymentMethod: z.enum(['cash', 'bank_transfer', 'mobile_money', 'cheque']).optional(),
     schoolId: z.number().optional(),
   })).mutation(async ({ input, ctx }) => {
     const database = await getDb();
     if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
     const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
     await database.insert(incomeRecords).values({
        category: input.category,
        amount: input.amount,
        description: input.description,
        payerName: input.payerName,
        payerContact: input.payerContact,
        studentId: input.studentId,
        paymentDate: input.paymentDate as any,
        paymentMethod: input.paymentMethod,
        schoolId: input.schoolId,
        receiptNumber,
       recordedBy: ctx.user.id,
     });
      await db.createAuditLog({ userId: ctx.user.id, action: 'record_income', tableName: 'incomeRecords', newValue: JSON.stringify({ amount: input.amount, category: input.category }) });
      return { success: true, receiptNumber };
    }),

    // Expenses
    expenseList: protectedProcedure.input(z.object({
      status: z.string().optional(),
      schoolId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return db.getExpenseRequests(input?.status, input?.schoolId);
    }),
    submitExpense: protectedProcedure.input(z.object({
      title: z.string(),
      description: z.string().optional(),
      amount: z.string(),
      category: z.string(),
      supportingDocs: z.string().optional(),
      schoolId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(expenseRequests).values({
        ...input,
        requestedBy: ctx.user.id,
        status: 'pending',
      });
      await db.createAuditLog({ userId: ctx.user.id, action: 'submit_expense', tableName: 'expenseRequests', newValue: JSON.stringify({ title: input.title, amount: input.amount }) });
      return { success: true };
    }),
    financeReview: financeProcedure.input(z.object({
      expenseId: z.number(),
      approved: z.boolean(),
      notes: z.string().optional(),
      budgetVerified: z.boolean().optional(),
      fundsAvailable: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.approved) {
        await database.update(expenseRequests).set({
          status: 'finance_reviewed',
          financeReviewedBy: ctx.user.id,
          financeReviewedAt: new Date(),
          financeNotes: input.notes,
          budgetVerified: input.budgetVerified,
          fundsAvailable: input.fundsAvailable,
        }).where(eq(expenseRequests.id, input.expenseId));
      } else {
        await database.update(expenseRequests).set({
          status: 'rejected',
          financeReviewedBy: ctx.user.id,
          financeReviewedAt: new Date(),
          financeNotes: input.notes,
        }).where(eq(expenseRequests.id, input.expenseId));
      }
      await db.createAuditLog({ userId: ctx.user.id, action: 'finance_review', tableName: 'expenseRequests', recordId: input.expenseId });
      return { success: true };
    }),
    principalApprove: principalProcedure.input(z.object({
      expenseId: z.number(),
      approved: z.boolean(),
      pin: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Verify PIN
      const user = await database.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user[0]?.approvalPin || user[0].approvalPin !== input.pin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid approval PIN. Access denied." });
      }
      if (input.approved) {
        await database.update(expenseRequests).set({
          status: 'principal_approved',
          principalApprovedBy: ctx.user.id,
          principalApprovedAt: new Date(),
          principalNotes: input.notes,
        }).where(eq(expenseRequests.id, input.expenseId));
      } else {
        await database.update(expenseRequests).set({
          status: 'rejected',
          principalApprovedBy: ctx.user.id,
          principalApprovedAt: new Date(),
          principalNotes: input.notes,
        }).where(eq(expenseRequests.id, input.expenseId));
      }
      await db.createAuditLog({ userId: ctx.user.id, action: 'principal_approval', tableName: 'expenseRequests', recordId: input.expenseId, newValue: input.approved ? 'approved' : 'rejected' });
      return { success: true };
    }),
    processPayment: financeProcedure.input(z.object({
      expenseId: z.number(),
      paymentMethod: z.enum(['cash', 'bank_transfer', 'mobile_money', 'cheque']),
      paymentReference: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Verify expense is principal_approved
      const [expense] = await database.select().from(expenseRequests).where(eq(expenseRequests.id, input.expenseId)).limit(1);
      if (!expense || expense.status !== 'principal_approved') {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Expense must be approved by Principal before payment." });
      }
      await database.update(expenseRequests).set({
        status: 'paid',
        paidBy: ctx.user.id,
        paidAt: new Date(),
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
      }).where(eq(expenseRequests.id, input.expenseId));
      await db.createAuditLog({ userId: ctx.user.id, action: 'process_payment', tableName: 'expenseRequests', recordId: input.expenseId });
      return { success: true };
    }),

    // Budgets
    budgetList: financeProcedure.input(z.object({
      academicYear: z.string().optional(),
      schoolId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return db.getBudgets(input?.academicYear, input?.schoolId);
    }),
    createBudget: financeProcedure.input(z.object({
      category: z.string(),
      allocatedAmount: z.string(),
      academicYear: z.string(),
      term: z.enum(['term1', 'term2', 'term3']).optional(),
      schoolId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(budgets).values({
        ...input,
        createdBy: ctx.user.id,
      });
      await db.createAuditLog({ userId: ctx.user.id, action: 'create_budget', tableName: 'budgets', newValue: JSON.stringify({ category: input.category, amount: input.allocatedAmount }) });
      return { success: true };
    }),

    // Payroll
    payrollList: financeProcedure.input(z.object({
      month: z.string(),
      schoolId: z.number().optional(),
    })).query(async ({ input }) => {
      return db.getPayrollByMonth(input.month, input?.schoolId);
    }),
    generatePayroll: financeProcedure.input(z.object({
      month: z.string(),
      schoolId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Get all active staff
      const staffConditions = [eq(staffRecords.status, 'active')];
      if (input.schoolId && input.schoolId > 0) staffConditions.push(eq(staffRecords.schoolId, input.schoolId));
      const staff = await database.select().from(staffRecords).where(and(...staffConditions));
      // For each staff, calculate payroll based on attendance
      for (const member of staff) {
        const baseSalary = parseFloat(member.baseSalary?.toString() || '0');
        // Get attendance for the month
        const attendanceRecords = await database.select().from(attendance).where(
          and(
            eq(attendance.personType, 'staff'),
            eq(attendance.personId, member.userId),
            sql`${attendance.date} >= ${input.month + '-01'}`,
            sql`${attendance.date} <= ${input.month + '-31'}`
          )
        );
        const daysWorked = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
        const daysAbsent = attendanceRecords.filter(a => a.status === 'absent').length;
        const lateArrivals = attendanceRecords.filter(a => a.status === 'late').length;
        // Calculate deductions for absences
        const dailyRate = baseSalary / 22; // 22 working days
        const deductions = daysAbsent * dailyRate;
        const attendanceBonus = lateArrivals === 0 && daysAbsent === 0 ? baseSalary * 0.05 : 0;
        const netSalary = baseSalary + attendanceBonus - deductions;
        await database.insert(payroll).values({
          staffId: member.userId,
          month: input.month,
          baseSalary: baseSalary.toFixed(2),
          attendanceBonus: attendanceBonus.toFixed(2),
          deductions: deductions.toFixed(2),
          netSalary: netSalary.toFixed(2),
          daysWorked,
          daysAbsent,
          lateArrivals,
          status: 'draft',
        });
      }
      await db.createAuditLog({ userId: ctx.user.id, action: 'generate_payroll', tableName: 'payroll', newValue: input.month });
      return { success: true, count: staff.length };
    }),
  }),

  // ============ ACADEMICS ============
  academics: router({
    classes: router({
      list: protectedProcedure.input(z.object({ schoolId: z.number().optional() }).optional()).query(async ({ input }) => {
        return db.getAllClasses(input?.schoolId);
      }),
      create: teacherProcedure.input(z.object({
        name: z.string(),
        gradeLevel: z.string(),
        section: z.string().optional(),
        schoolId: z.number().optional(),
        classTeacherId: z.number().optional(),
        capacity: z.number().optional(),
        academicYear: z.string(),
      })).mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await database.insert(classes).values(input);
        return { success: true };
      }),
    }),
    subjects: router({
      list: protectedProcedure.input(z.object({ schoolId: z.number().optional() }).optional()).query(async ({ input }) => {
        return db.getAllSubjects(input?.schoolId);
      }),
      create: teacherProcedure.input(z.object({
        name: z.string(),
        code: z.string(),
        department: z.string().optional(),
        gradeLevel: z.string().optional(),
        description: z.string().optional(),
        schoolId: z.number().optional(),
      })).mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await database.insert(subjects).values(input);
        return { success: true };
      }),
    }),
    grades: router({
      getByStudent: protectedProcedure.input(z.object({ studentId: z.number() })).query(async ({ input }) => {
        return db.getGradesByStudent(input.studentId);
      }),
      enter: teacherProcedure.input(z.object({
        studentId: z.number(),
        subjectId: z.number(),
        classId: z.number(),
        term: z.enum(['term1', 'term2', 'term3']),
        academicYear: z.string(),
        assessmentType: z.enum(['continuous', 'midterm', 'final']),
        score: z.string(),
        maxScore: z.string().optional(),
        grade: z.string().optional(),
        remarks: z.string().optional(),
      })).mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await database.insert(grades).values({
          ...input,
          enteredBy: ctx.user.id,
        });
        return { success: true };
      }),
    }),
    lessonPlans: router({
      list: teacherProcedure.input(z.object({
        teacherId: z.number().optional(),
      }).optional()).query(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) return [];
        const teacherId = input?.teacherId || ctx.user.id;
        return database.select().from(lessonPlans).where(eq(lessonPlans.teacherId, teacherId)).orderBy(desc(lessonPlans.createdAt));
      }),
      create: teacherProcedure.input(z.object({
       subjectId: z.number(),
       classId: z.number(),
       date: z.string(),
       topic: z.string(),
       objectives: z.string().optional(),
       content: z.string().optional(),
       activities: z.string().optional(),
       resources: z.string().optional(),
       assessment: z.string().optional(),
     })).mutation(async ({ input, ctx }) => {
       const database = await getDb();
       if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
       await database.insert(lessonPlans).values({
          subjectId: input.subjectId,
          classId: input.classId,
          date: input.date as any,
          topic: input.topic,
          objectives: input.objectives,
          content: input.content,
          activities: input.activities,
          resources: input.resources,
          assessment: input.assessment,
         teacherId: ctx.user.id,
         status: 'submitted',
       });
        return { success: true };
      }),
    }),
    timetable: router({
      list: protectedProcedure.input(z.object({
        classId: z.number().optional(),
        teacherId: z.number().optional(),
      }).optional()).query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        const conditions = [];
        if (input?.classId) conditions.push(eq(timetable.classId, input.classId));
        if (input?.teacherId) conditions.push(eq(timetable.teacherId, input.teacherId));
        if (conditions.length > 0) {
          return database.select().from(timetable).where(and(...conditions));
        }
        return database.select().from(timetable);
      }),
      create: teacherProcedure.input(z.object({
        classId: z.number(),
        subjectId: z.number(),
        teacherId: z.number(),
        dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        period: z.number(),
        startTime: z.string(),
        endTime: z.string(),
        term: z.enum(['term1', 'term2', 'term3']),
        academicYear: z.string(),
      })).mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await database.insert(timetable).values(input);
        return { success: true };
      }),
    }),
    calendar: router({
     list: protectedProcedure.input(z.object({ schoolId: z.number().optional() }).optional()).query(async ({ input }) => {
       const database = await getDb();
       if (!database) return [];
       if (input?.schoolId && input.schoolId > 0) {
         return database.select().from(academicCalendar).where(eq(academicCalendar.schoolId, input.schoolId)).orderBy(desc(academicCalendar.startDate));
       }
       return database.select().from(academicCalendar).orderBy(desc(academicCalendar.startDate));
     }),
     create: teacherProcedure.input(z.object({
       title: z.string(),
       eventType: z.enum(['term_start', 'term_end', 'holiday', 'exam', 'meeting', 'event']),
       startDate: z.string(),
       endDate: z.string().optional(),
       description: z.string().optional(),
       schoolLocation: z.enum(['kabale', 'equator', 'all']).optional(),
     })).mutation(async ({ input }) => {
       const database = await getDb();
       if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await database.insert(academicCalendar).values({
          title: input.title,
          eventType: input.eventType,
          startDate: input.startDate as any,
          endDate: input.endDate as any,
          description: input.description,
          schoolLocation: input.schoolLocation,
        });
       return { success: true };
     }),
   }),
  }),

  // ============ HR ============
  hr: router({
    staffList: protectedProcedure.input(z.object({ schoolId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.getAllStaff(input?.schoolId);
    }),
    createStaff: hrProcedure.input(z.object({
     userId: z.number(),
     employeeId: z.string(),
     position: z.string().optional(),
     department: z.string().optional(),
     qualification: z.string().optional(),
     dateOfJoining: z.string().optional(),
     contractType: z.enum(['permanent', 'contract', 'temporary']).optional(),
     baseSalary: z.string().optional(),
     schoolId: z.number().optional(),
   })).mutation(async ({ input, ctx }) => {
     const database = await getDb();
     if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(staffRecords).values({
        userId: input.userId,
        employeeId: input.employeeId,
        position: input.position,
        department: input.department,
        qualification: input.qualification,
        dateOfJoining: input.dateOfJoining as any,
        contractType: input.contractType,
        baseSalary: input.baseSalary,
        schoolId: input.schoolId,
      });
     await db.createAuditLog({ userId: ctx.user.id, action: 'create_staff', tableName: 'staffRecords', newValue: JSON.stringify({ employeeId: input.employeeId }) });
     return { success: true };
   }),
    leaveRequests: router({
      list: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async ({ input }) => {
        return db.getLeaveRequests(input?.status);
      }),
      create: protectedProcedure.input(z.object({
      leaveType: z.enum(['annual', 'sick', 'compassionate', 'maternity', 'paternity', 'professional_development']),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(leaveRequests).values({
         leaveType: input.leaveType,
         startDate: input.startDate as any,
         endDate: input.endDate as any,
         reason: input.reason,
        staffId: ctx.user.id,
        status: 'pending',
      });
       return { success: true };
     }),
      approve: hrProcedure.input(z.object({
        id: z.number(),
        approved: z.boolean(),
      })).mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await database.update(leaveRequests).set({
          status: input.approved ? 'approved' : 'rejected',
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
        }).where(eq(leaveRequests.id, input.id));
        await db.createAuditLog({ userId: ctx.user.id, action: 'approve_leave', tableName: 'leaveRequests', recordId: input.id, newValue: input.approved ? 'approved' : 'rejected' });
        return { success: true };
      }),
    }),
  }),

  // ============ REPORTS ============
  reports: router({
    financeSummary: financeProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      schoolId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      const database = await getDb();
      if (!database) return { totalIncome: 0, totalExpenses: 0, balance: 0 };
      const incomeConditions: any[] = [];
      const expenseConditions = [eq(expenseRequests.status, 'paid')];
      if (input?.schoolId && input.schoolId > 0) {
        incomeConditions.push(eq(incomeRecords.schoolId, input.schoolId));
        expenseConditions.push(eq(expenseRequests.schoolId, input.schoolId));
      }
      const [incomeSum] = incomeConditions.length > 0
        ? await database.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(incomeRecords).where(and(...incomeConditions))
        : await database.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(incomeRecords);
      const [expenseSum] = await database.select({ total: sql<string>`COALESCE(SUM(amount), 0)` }).from(expenseRequests).where(and(...expenseConditions));
      const totalIncome = parseFloat(incomeSum?.total || '0');
      const totalExpenses = parseFloat(expenseSum?.total || '0');
      return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
    }),
    attendanceReport: protectedProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      personType: z.string().optional(),
      schoolId: z.number().optional(),
    })).query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];
      const conditions = [
        sql`${attendance.date} >= ${input.startDate}`,
        sql`${attendance.date} <= ${input.endDate}`,
      ];
      if (input.personType) conditions.push(eq(attendance.personType, input.personType as any));
      if (input.schoolId && input.schoolId > 0) conditions.push(eq(attendance.schoolId, input.schoolId));
      return database.select().from(attendance).where(and(...conditions)).orderBy(desc(attendance.date));
    }),
    auditLog: principalProcedure.input(z.object({
     limit: z.number().optional(),
   }).optional()).query(async ({ input }) => {
     const database = await getDb();
     if (!database) return [];
     return database.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(input?.limit || 100);
   }),
 }),

  // ============ ADMIN ============
  admin: router({
    userList: principalProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database.select().from(users).orderBy(desc(users.createdAt));
    }),
    setPin: principalProcedure.input(z.object({
      pin: z.string().min(4).max(8),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(users).set({ approvalPin: input.pin }).where(eq(users.id, ctx.user.id));
      await db.createAuditLog({ userId: ctx.user.id, action: 'set_approval_pin', tableName: 'users', recordId: ctx.user.id });
      return { success: true };
    }),
    updateRole: principalProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(['user', 'admin', 'principal', 'bursar', 'director_of_studies', 'teacher', 'department_head']),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      await db.createAuditLog({ userId: ctx.user.id, action: 'update_role', tableName: 'users', recordId: input.userId, newValue: input.role });
      return { success: true };
    }),
    auditLog: principalProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      return database.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
    }),
  }),
});

export type AppRouter = typeof appRouter;
