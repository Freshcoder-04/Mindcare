import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkDbConnection } from "./db";
import { runMigrations } from "./migrate";
import { PgStorage } from "./pg-storage";
import http from "http";
import "./listeners";

// Initialize the application
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

// Main initialization function
(async () => {
  try {
    // 1. Check database connection
    const connected = await checkDbConnection();
    if (!connected) {
      log("Database connection failed. Exiting...", "db");
      process.exit(1);
    }

    // 2. Run migrations
    await runMigrations();
    log("Database migrations completed successfully", "db");

    // 3. Initialize default data
    const pgStorage = new PgStorage();
    await pgStorage.initializeDefaultData();
    log("PostgreSQL storage initialized with default data", "db");

    // 4. Setup WebSocket + routes
    const server = await registerRoutes(app);

    // 5. Setup Vite or static serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // 6. Start the server
    const port = 8080;
    server.listen(port, () => {
      log(`Server + WebSocket running at http://localhost:${port}`);
    });
  } catch (err) {
    log(`Error during server startup: ${err}`, "server");
    process.exit(1);
  }
})();

