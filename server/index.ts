import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkDbConnection } from "./db";
import { runMigrations } from "./migrate";
import { PgStorage } from "./pg-storage";
import http from "http";

// Initialize the database connection and run migrations
checkDbConnection()
  .then(connected => {
    if (!connected) {
      log("Database connection failed. Exiting...", "db");
      process.exit(1);
    }
    return runMigrations();
  })
  .then(() => {
    log("Database setup completed successfully", "db");
  })
  .catch(error => {
    log(`Database setup error: ${error}`, "db");
    process.exit(1);
  });

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

// Setup routes
// registerRoutes(app);

// // Create HTTP server from Express app
// const server = http.createServer(app);
//   let server: http.Server;
//   (async () => {
//     server = await registerRoutes(app);
//   })();

      

// // Initialize default PostgreSQL data
// (async () => {
//   try {
//     const pgStorage = new PgStorage();
//     await pgStorage.initializeDefaultData();
//     log("PostgreSQL storage initialized with default data", "db");
//   } catch (error) {
//     log(`Error initializing PostgreSQL storage: ${error}`, "db");
//   }

//   // Setup Vite in development mode, else serve static assets.
//   if (app.get("env") === "development") {
//     // Pass both the app and the HTTP server to setupVite.
//     await setupVite(app, server);
//   } else {
//     serveStatic(app);
//   }

//   // Listen on port 8080
//   const port = 8080;
//   server.listen(port, () => {
//     log(`Server is running on port ${port}`);
//   });
// })();
(async () => {
  try {
    // Setup DB
    const pgStorage = new PgStorage();
    await pgStorage.initializeDefaultData();
    log("PostgreSQL storage initialized with default data", "db");

    // Setup WebSocket + routes
    const server = await registerRoutes(app);

    // Setup Vite or static serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server
    const port = 8080;
    server.listen(port, () => {
      log(` Server + WebSocket running at http://localhost:${port}`);
    });
  } catch (err) {
    log(`Error during server startup: ${err}`, "server");
    process.exit(1);
  }
})();

