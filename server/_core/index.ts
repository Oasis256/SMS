import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { dailyCashSummaryHandler, weeklyAttendanceReportHandler, monthlyFinancialStatementHandler, absenceNotificationHandler, feeReminderHandler } from "../scheduled";
import { createHeartbeatJob, listHeartbeatJobs } from "./heartbeat";
import { sdk } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Scheduled/cron endpoints (must be before tRPC and Vite)
  app.post("/api/scheduled/daily-cash-summary", dailyCashSummaryHandler);
  app.post("/api/scheduled/weekly-attendance-report", weeklyAttendanceReportHandler);
  app.post("/api/scheduled/monthly-financial-statement", monthlyFinancialStatementHandler);
  app.post("/api/scheduled/absence-notification", absenceNotificationHandler);
  app.post("/api/scheduled/fee-reminder", feeReminderHandler);
  // Admin endpoint to setup all cron jobs
  app.post("/api/scheduled/setup-cron", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user || (user.role !== 'admin' && user.role !== 'principal')) {
        return res.status(403).json({ error: "Admin/Principal only" });
      }
      const sessionHeader = req.headers['x-session'] as string || '';
      const jobs = [
        { name: "daily-cash-summary", cron: "0 0 15 * * *", path: "/api/scheduled/daily-cash-summary", description: "Daily cash summary at 6 PM EAT" },
        { name: "weekly-attendance-report", cron: "0 0 4 * * 1", path: "/api/scheduled/weekly-attendance-report", description: "Weekly attendance report Monday 7 AM EAT" },
        { name: "monthly-financial-statement", cron: "0 0 5 1 * *", path: "/api/scheduled/monthly-financial-statement", description: "Monthly financial statement 1st of month 8 AM EAT" },
        { name: "absence-notification", cron: "0 0 7 * * *", path: "/api/scheduled/absence-notification", description: "Daily absence notification 10 AM EAT" },
        { name: "fee-reminder", cron: "0 0 6 * * 5", path: "/api/scheduled/fee-reminder", description: "Weekly fee reminder Friday 9 AM EAT" },
      ];
      const results = [];
      for (const job of jobs) {
        try {
          const result = await createHeartbeatJob(job, sessionHeader);
          results.push({ name: job.name, status: 'created', taskUid: result.taskUid });
        } catch (e: any) {
          results.push({ name: job.name, status: 'error', message: e.message });
        }
      }
      res.json({ ok: true, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
