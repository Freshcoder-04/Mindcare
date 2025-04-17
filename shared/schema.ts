import { ColumnBaseConfig, ColumnDataType } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum, ExtraConfigColumn, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'counselor']);
export const assessmentStatusEnum = pgEnum('assessment_status', ['pending', 'completed']);
export const appointmentStatusEnum = pgEnum('appointment_status', ['scheduled', 'canceled', 'completed']);
export const resourceTypeEnum = pgEnum('resource_type', ['article', 'video', 'external_link']);
export const chatRoomTypeEnum = pgEnum('chat_room_type', ['group', 'direct']);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assessment Questions Table
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  category: text("category").notNull(),
  weight: integer("weight").notNull().default(1),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").notNull().default(true),
});

// Assessment Submissions Table
export const assessmentSubmissions = pgTable("assessment_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  responses: json("responses").$type<Record<string, number>>().notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback"),
  status: assessmentStatusEnum("status").notNull().default('completed'),
  flagged: boolean("flagged").default(false),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resources Table
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"),
  type: resourceTypeEnum("type").notNull(),
  url: text("url"),
  category: text("category").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").notNull().default(true),
});

// Saved Resources Table
export const savedResources = pgTable("saved_resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Rooms Table
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: chatRoomTypeEnum("type").notNull().default('group'),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").notNull().default(true),
});

// chat_room_memberships.ts
// export const chatRoomMemberships = pgTable("chat_room_memberships", {
//   // id: serial("id").primaryKey(),
//   userId: integer("user_id").notNull().references(() => users.id),
//   roomId: integer("room_id").notNull().references(() => chatRooms.id),
//   joinedAt: timestamp("joined_at").defaultNow(),
// });

export const chatRoomMemberships = pgTable("chat_room_memberships", {
  userId: integer("user_id").notNull().references(() => users.id),
  roomId: integer("room_id").notNull().references(() => chatRooms.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roomId] }), // composite PK
}));


// Chat Messages Table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments Table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  counselorId: integer("counselor_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: appointmentStatusEnum("status").notNull().default('scheduled'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Available Slots Table
export const availableSlots = pgTable("available_slots", {
  id: serial("id").primaryKey(),
  counselorId: integer("counselor_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type ChatRoomMembership = typeof chatRoomMemberships.$inferSelect;
export type InsertChatRoomMembership = typeof chatRoomMemberships.$inferInsert;


export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertAssessmentSubmissionSchema = createInsertSchema(assessmentSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export const insertSavedResourceSchema = createInsertSchema(savedResources).omit({
  id: true,
  createdAt: true,
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertAvailableSlotSchema = createInsertSchema(availableSlots).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;

export type AssessmentSubmission = typeof assessmentSubmissions.$inferSelect;
export type InsertAssessmentSubmission = z.infer<typeof insertAssessmentSubmissionSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type SavedResource = typeof savedResources.$inferSelect;
export type InsertSavedResource = z.infer<typeof insertSavedResourceSchema>;

export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type AvailableSlot = typeof availableSlots.$inferSelect;
export type InsertAvailableSlot = z.infer<typeof insertAvailableSlotSchema>;

// function primaryKey(arg0: { columns: ExtraConfigColumn<ColumnBaseConfig<ColumnDataType, string>>[]; }): import("drizzle-orm/pg-core").PgTableExtraConfigValue {
//   throw new Error("Function not implemented.");
// }

