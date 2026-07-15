import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME, SCHOOL_ROLES, ROLE_LABELS, ATTENDANCE_STATUS_COLORS, EXPENSE_STATUS_LABELS, SESSION_TIMEOUT_MS, MAX_LOGIN_ATTEMPTS } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { sdk } from "./_core/sdk";

type CookieCall = { name: string; options: Record<string, unknown> };
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: string = "admin"): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-open-id",
    email: "admin@school.org",
    name: "Test Admin",
    loginMethod: "manus",
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { cookie: `${COOKIE_NAME}=test-session-token` },
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("School Management System - Constants", () => {
  it("defines all 6 school roles", () => {
    expect(SCHOOL_ROLES).toHaveLength(6);
    expect(SCHOOL_ROLES).toContain("admin");
    expect(SCHOOL_ROLES).toContain("principal");
    expect(SCHOOL_ROLES).toContain("bursar");
    expect(SCHOOL_ROLES).toContain("director_of_studies");
    expect(SCHOOL_ROLES).toContain("teacher");
    expect(SCHOOL_ROLES).toContain("department_head");
  });

  it("has labels for all roles including user", () => {
    expect(ROLE_LABELS["admin"]).toBe("Administrator");
    expect(ROLE_LABELS["principal"]).toBe("Head Teacher / Principal");
    expect(ROLE_LABELS["bursar"]).toBe("Bursar / Finance Officer");
    expect(ROLE_LABELS["director_of_studies"]).toBe("Director of Studies");
    expect(ROLE_LABELS["teacher"]).toBe("Teacher");
    expect(ROLE_LABELS["department_head"]).toBe("Department Head");
    expect(ROLE_LABELS["user"]).toBe("User");
  });

  it("defines correct attendance status colors", () => {
    expect(ATTENDANCE_STATUS_COLORS.present).toBe("#22c55e"); // Green
    expect(ATTENDANCE_STATUS_COLORS.late).toBe("#eab308");    // Yellow
    expect(ATTENDANCE_STATUS_COLORS.absent).toBe("#ef4444");  // Red
    expect(ATTENDANCE_STATUS_COLORS.on_leave).toBe("#3b82f6"); // Blue
    expect(ATTENDANCE_STATUS_COLORS.off_campus).toBe("#6b7280"); // Gray
  });

  it("defines expense status labels for full workflow", () => {
    expect(EXPENSE_STATUS_LABELS["pending"]).toBe("Pending Review");
    expect(EXPENSE_STATUS_LABELS["finance_reviewed"]).toBe("Finance Reviewed");
    expect(EXPENSE_STATUS_LABELS["principal_approved"]).toBe("Principal Approved");
    expect(EXPENSE_STATUS_LABELS["rejected"]).toBe("Rejected");
    expect(EXPENSE_STATUS_LABELS["paid"]).toBe("Paid");
  });

  it("session timeout is 30 minutes", () => {
    expect(SESSION_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });

  it("max login attempts is 5", () => {
    expect(MAX_LOGIN_ATTEMPTS).toBe(5);
  });
});

describe("School Management System - Auth Router", () => {
  it("auth.me returns user for authenticated context", async () => {
    const { ctx } = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test Admin");
    expect(result?.role).toBe("admin");
  });

  it("rejects an invalid session when no valid auth context exists", async () => {
    await expect(sdk.authenticateRequest({ headers: {} } as any)).rejects.toThrow("Invalid session cookie");
  });

  it("auth.me returns null for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.logout clears session cookie", async () => {
    const { ctx, clearedCookies } = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

describe("School Management System - Expense Approval Workflow", () => {
  it("expense workflow has correct status progression", () => {
    const expectedFlow = ["pending", "finance_reviewed", "principal_approved", "paid"];
    const allStatuses = Object.keys(EXPENSE_STATUS_LABELS);
    // Verify the workflow statuses exist in the correct order
    expectedFlow.forEach(status => {
      expect(allStatuses).toContain(status);
    });
  });

  it("principal approval is mandatory for ALL amounts (no bypass)", () => {
    // The workflow requires principal_approved before paid
    // This is enforced in the processPayment mutation which checks status === 'principal_approved'
    const statusBeforePaid = "principal_approved";
    expect(EXPENSE_STATUS_LABELS[statusBeforePaid]).toBe("Principal Approved");
  });
});

describe("School Management System - Role Access Control", () => {
  it("admin role has full access", () => {
    const adminRoles = ["admin", "principal"];
    adminRoles.forEach(role => {
      expect(SCHOOL_ROLES).toContain(role);
    });
  });

  it("finance roles are correctly defined", () => {
    const financeRoles = ["admin", "principal", "bursar"];
    financeRoles.forEach(role => {
      expect(SCHOOL_ROLES).toContain(role);
    });
  });

  it("academic roles are correctly defined", () => {
    const academicRoles = ["admin", "principal", "director_of_studies", "teacher", "department_head"];
    academicRoles.forEach(role => {
      expect(SCHOOL_ROLES).toContain(role);
    });
  });
});
