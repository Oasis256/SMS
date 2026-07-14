import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Role-based procedures for the school management system
type SchoolRole = 'admin' | 'principal' | 'bursar' | 'director_of_studies' | 'teacher' | 'department_head';

function createRoleProcedure(allowedRoles: SchoolRole[]) {
  return t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
      }
      const userRole = ctx.user.role as SchoolRole;
      if (!allowedRoles.includes(userRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this resource." });
      }
      return next({ ctx: { ...ctx, user: ctx.user } });
    }),
  );
}

// Principal can access everything
export const principalProcedure = createRoleProcedure(['admin', 'principal']);

// Bursar can access finance
export const bursarProcedure = createRoleProcedure(['admin', 'principal', 'bursar']);

// Director of Studies can access academics
export const dosProcedure = createRoleProcedure(['admin', 'principal', 'director_of_studies']);

// Teachers can access their own classes
export const teacherProcedure = createRoleProcedure(['admin', 'principal', 'director_of_studies', 'teacher', 'department_head']);

// Department heads
export const deptHeadProcedure = createRoleProcedure(['admin', 'principal', 'director_of_studies', 'department_head']);

// Finance-related (bursar + principal + admin)
export const financeProcedure = createRoleProcedure(['admin', 'principal', 'bursar']);

// HR-related (admin + principal)
export const hrProcedure = createRoleProcedure(['admin', 'principal', 'bursar']);
