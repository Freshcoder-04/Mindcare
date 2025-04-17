import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";
import pgPkg from "pg";
const { Pool } = pgPkg;
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./shared/schema";

// Create a PostgreSQL connection pool
console.log("Using DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// This script is used to generate migration files for our schema
async function main() {
  try {
    console.log("Connecting to database...");
    const db = drizzle(pool, { schema });
    
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "migrations" });
    
    console.log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

main();