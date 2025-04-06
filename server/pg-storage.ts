import { eq, or, and, inArray, asc, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  IStorage,
  User, InsertUser,
  AssessmentQuestion, InsertAssessmentQuestion,
  AssessmentSubmission, InsertAssessmentSubmission,
  Resource, InsertResource,
  SavedResource, InsertSavedResource,
  ChatRoom, InsertChatRoom,
  ChatMessage, InsertChatMessage,
  Appointment, InsertAppointment,
  AvailableSlot, InsertAvailableSlot
} from "./storage";
import * as schema from "../shared/schema";

/**
 * PostgreSQL implementation of IStorage
 */
export class PgStorage implements IStorage {
  
  // ===== User Operations =====
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      console.log("Creating user in PostgreSQL:", { ...user, password: '[REDACTED]' });
      const result = await db.insert(schema.users).values({
        username: user.username,
        password: user.password,
        role: user.role || 'student'
      }).returning();
      console.log("User created successfully:", { id: result[0].id, username: result[0].username, role: result[0].role });
      return result[0];
    } catch (error) {
      console.error("Error creating user in PostgreSQL:", error);
      throw error;
    }
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.users);
    return Number(result[0].count);
  }

  // ===== Assessment Question Operations =====

  async getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
    return await db.select().from(schema.assessmentQuestions).where(eq(schema.assessmentQuestions.active, true));
  }

  async getAssessmentQuestion(id: number): Promise<AssessmentQuestion | undefined> {
    const result = await db.select().from(schema.assessmentQuestions).where(eq(schema.assessmentQuestions.id, id)).limit(1);
    return result[0];
  }

  async createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const result = await db.insert(schema.assessmentQuestions).values(question).returning();
    return result[0];
  }

  async updateAssessmentQuestion(id: number, question: Partial<InsertAssessmentQuestion>): Promise<AssessmentQuestion | undefined> {
    const result = await db.update(schema.assessmentQuestions)
      .set(question)
      .where(eq(schema.assessmentQuestions.id, id))
      .returning();
    return result[0];
  }

  async deleteAssessmentQuestion(id: number): Promise<boolean> {
    // Soft delete by setting active to false
    const result = await db.update(schema.assessmentQuestions)
      .set({ active: false })
      .where(eq(schema.assessmentQuestions.id, id))
      .returning();
    return result.length > 0;
  }

  // ===== Assessment Submission Operations =====

  async getAssessmentSubmissions(userId?: number): Promise<AssessmentSubmission[]> {
    if (userId) {
      return await db.select().from(schema.assessmentSubmissions)
        .where(eq(schema.assessmentSubmissions.userId, userId))
        .orderBy(desc(schema.assessmentSubmissions.createdAt));
    }
    return await db.select().from(schema.assessmentSubmissions)
      .orderBy(desc(schema.assessmentSubmissions.createdAt));
  }

  async getAssessmentSubmission(id: number): Promise<AssessmentSubmission | undefined> {
    const result = await db.select().from(schema.assessmentSubmissions)
      .where(eq(schema.assessmentSubmissions.id, id))
      .limit(1);
    return result[0];
  }

  async createAssessmentSubmission(submission: InsertAssessmentSubmission): Promise<AssessmentSubmission> {
    const result = await db.insert(schema.assessmentSubmissions).values(submission).returning();
    return result[0];
  }

  async getFlaggedSubmissions(): Promise<AssessmentSubmission[]> {
    return await db.select().from(schema.assessmentSubmissions)
      .where(eq(schema.assessmentSubmissions.flagged, true))
      .orderBy(desc(schema.assessmentSubmissions.createdAt));
  }

  // ===== Resource Operations =====

  async getResources(category?: string): Promise<Resource[]> {
    if (category) {
      return await db.select().from(schema.resources)
        .where(and(
          eq(schema.resources.active, true),
          eq(schema.resources.category, category)
        ))
        .orderBy(asc(schema.resources.title));
    }
    return await db.select().from(schema.resources)
      .where(eq(schema.resources.active, true))
      .orderBy(asc(schema.resources.title));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const result = await db.select().from(schema.resources)
      .where(eq(schema.resources.id, id))
      .limit(1);
    return result[0];
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const result = await db.insert(schema.resources).values(resource).returning();
    return result[0];
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const result = await db.update(schema.resources)
      .set(resource)
      .where(eq(schema.resources.id, id))
      .returning();
    return result[0];
  }

  async deleteResource(id: number): Promise<boolean> {
    // Soft delete by setting active to false
    const result = await db.update(schema.resources)
      .set({ active: false })
      .where(eq(schema.resources.id, id))
      .returning();
    return result.length > 0;
  }

  // ===== Saved Resource Operations =====

  async getSavedResources(userId: number): Promise<SavedResource[]> {
    return await db.select().from(schema.savedResources)
      .where(eq(schema.savedResources.userId, userId))
      .orderBy(desc(schema.savedResources.createdAt));
  }

  async saveResource(savedResource: InsertSavedResource): Promise<SavedResource> {
    // Check if already saved
    const existing = await db.select().from(schema.savedResources)
      .where(and(
        eq(schema.savedResources.userId, savedResource.userId),
        eq(schema.savedResources.resourceId, savedResource.resourceId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const result = await db.insert(schema.savedResources).values(savedResource).returning();
    return result[0];
  }

  async unsaveResource(userId: number, resourceId: number): Promise<boolean> {
    const result = await db.delete(schema.savedResources)
      .where(and(
        eq(schema.savedResources.userId, userId),
        eq(schema.savedResources.resourceId, resourceId)
      ))
      .returning();
    return result.length > 0;
  }

  // ===== Chat Room Operations =====

  async getChatRooms(): Promise<ChatRoom[]> {
    return await db.select().from(schema.chatRooms)
      .orderBy(asc(schema.chatRooms.name));
  }

  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const result = await db.select().from(schema.chatRooms)
      .where(eq(schema.chatRooms.id, id))
      .limit(1);
    return result[0];
  }

  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> {
    const result = await db.insert(schema.chatRooms).values(room).returning();
    return result[0];
  }

  // ===== Chat Message Operations =====

  async getChatMessages(roomId: number): Promise<ChatMessage[]> {
    return await db.select().from(schema.chatMessages)
      .where(eq(schema.chatMessages.roomId, roomId))
      .orderBy(asc(schema.chatMessages.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(schema.chatMessages).values(message).returning();
    return result[0];
  }

  // ===== Appointment Operations =====

  async getAppointments(userId?: number, role?: 'student' | 'counselor'): Promise<Appointment[]> {
    if (userId && role) {
      if (role === 'student') {
        return await db.select().from(schema.appointments)
          .where(eq(schema.appointments.studentId, userId))
          .orderBy(desc(schema.appointments.startTime));
      } else {
        return await db.select().from(schema.appointments)
          .where(eq(schema.appointments.counselorId, userId))
          .orderBy(desc(schema.appointments.startTime));
      }
    }
    return await db.select().from(schema.appointments)
      .orderBy(desc(schema.appointments.startTime));
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const result = await db.select().from(schema.appointments)
      .where(eq(schema.appointments.id, id))
      .limit(1);
    return result[0];
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(schema.appointments).values(appointment).returning();
    return result[0];
  }

  async updateAppointment(id: number, status: 'scheduled' | 'canceled' | 'completed'): Promise<Appointment | undefined> {
    const result = await db.update(schema.appointments)
      .set({ status })
      .where(eq(schema.appointments.id, id))
      .returning();
    return result[0];
  }

  // ===== Available Slot Operations =====

  async getAvailableSlots(counselorId?: number): Promise<AvailableSlot[]> {
    if (counselorId) {
      return await db.select().from(schema.availableSlots)
        .where(eq(schema.availableSlots.counselorId, counselorId))
        .orderBy(asc(schema.availableSlots.startTime));
    }
    return await db.select().from(schema.availableSlots)
      .orderBy(asc(schema.availableSlots.startTime));
  }

  async getAvailableSlot(id: number): Promise<AvailableSlot | undefined> {
    const result = await db.select().from(schema.availableSlots)
      .where(eq(schema.availableSlots.id, id))
      .limit(1);
    return result[0];
  }

  async createAvailableSlot(slot: InsertAvailableSlot): Promise<AvailableSlot> {
    const result = await db.insert(schema.availableSlots).values(slot).returning();
    return result[0];
  }

  async updateAvailableSlot(id: number, isBooked: boolean): Promise<AvailableSlot | undefined> {
    const result = await db.update(schema.availableSlots)
      .set({ isBooked })
      .where(eq(schema.availableSlots.id, id))
      .returning();
    return result[0];
  }

  // ===== Seed Data =====

  /**
   * Initialize the database with default data
   */
  async initializeDefaultData() {
    try {
      // Check if we need to initialize data
      const existingUsers = await db.select().from(schema.users).limit(1);
      if (existingUsers.length > 0) {
        console.log("Database already has data, skipping initialization");
        return;
      }

      console.log("Initializing database with default data");

      // Create initial counselor account
      const counselor = await this.createUser({
        username: "counselor",
        password: "password123",
        role: "counselor"
      });

      // Create a general chat room
      const generalRoom = await this.createChatRoom({
        name: "General Support",
        description: "A general chat room for all students to discuss mental health topics and get support.",
        type: "group"
      });

      console.log("Database initialization completed successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
}