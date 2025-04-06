import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";
import { log } from "./vite";
import { promises as fs } from 'fs';
import path from 'path';
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Run database migrations
 */
export async function runMigrations() {
  try {
    log("Running database migrations...", "migrate");
    
    // Create enum types if they don't exist
    log("Creating enum types...", "migrate");
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE user_role AS ENUM ('student', 'counselor');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_status') THEN
          CREATE TYPE assessment_status AS ENUM ('pending', 'completed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
          CREATE TYPE appointment_status AS ENUM ('scheduled', 'canceled', 'completed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
          CREATE TYPE resource_type AS ENUM ('article', 'video', 'external_link');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_room_type') THEN
          CREATE TYPE chat_room_type AS ENUM ('group', 'direct');
        END IF;
      END $$;
    `);
    
    // Create tables if they don't exist
    log("Creating database tables...", "migrate");
    
    // Users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Assessment questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assessment_questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        category TEXT NOT NULL,
        weight INTEGER NOT NULL DEFAULT 1,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    
    // Assessment submissions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assessment_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        responses JSONB NOT NULL,
        score INTEGER NOT NULL,
        feedback TEXT,
        status assessment_status NOT NULL DEFAULT 'completed',
        flagged BOOLEAN DEFAULT FALSE,
        reviewed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Resources table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        content TEXT,
        type resource_type NOT NULL,
        url TEXT,
        category TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    
    // Saved resources table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS saved_resources (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        resource_id INTEGER NOT NULL REFERENCES resources(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Chat rooms table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type chat_room_type NOT NULL DEFAULT 'group',
        created_at TIMESTAMP DEFAULT NOW(),
        active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    
    // Chat messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Appointments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES users(id),
        counselor_id INTEGER NOT NULL REFERENCES users(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status appointment_status NOT NULL DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Available slots table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS available_slots (
        id SERIAL PRIMARY KEY,
        counselor_id INTEGER NOT NULL REFERENCES users(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        is_booked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    log("Database migrations completed successfully", "migrate");
  } catch (error) {
    log(`Error running migrations: ${error}`, "migrate");
    throw error;
  }
}