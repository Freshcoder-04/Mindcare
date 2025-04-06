import {
  users, assessmentQuestions, assessmentSubmissions,
  resources, savedResources, chatRooms, chatMessages,
  appointments, availableSlots,
  type User, type InsertUser,
  type AssessmentQuestion, type InsertAssessmentQuestion,
  type AssessmentSubmission, type InsertAssessmentSubmission,
  type Resource, type InsertResource,
  type SavedResource, type InsertSavedResource,
  type ChatRoom, type InsertChatRoom,
  type ChatMessage, type InsertChatMessage,
  type Appointment, type InsertAppointment,
  type AvailableSlot, type InsertAvailableSlot
} from "@shared/schema";

// Re-export the types from the schema for use in other modules
export type {
  User, InsertUser,
  AssessmentQuestion, InsertAssessmentQuestion,
  AssessmentSubmission, InsertAssessmentSubmission,
  Resource, InsertResource,
  SavedResource, InsertSavedResource,
  ChatRoom, InsertChatRoom,
  ChatMessage, InsertChatMessage,
  Appointment, InsertAppointment,
  AvailableSlot, InsertAvailableSlot
};

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Assessment operations
  getAssessmentQuestions(): Promise<AssessmentQuestion[]>;
  getAssessmentQuestion(id: number): Promise<AssessmentQuestion | undefined>;
  createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion>;
  updateAssessmentQuestion(id: number, question: Partial<InsertAssessmentQuestion>): Promise<AssessmentQuestion | undefined>;
  deleteAssessmentQuestion(id: number): Promise<boolean>;
  
  // Assessment submission operations
  getAssessmentSubmissions(userId?: number): Promise<AssessmentSubmission[]>;
  getAssessmentSubmission(id: number): Promise<AssessmentSubmission | undefined>;
  createAssessmentSubmission(submission: InsertAssessmentSubmission): Promise<AssessmentSubmission>;
  getFlaggedSubmissions(): Promise<AssessmentSubmission[]>;
  
  // Resource operations
  getResources(category?: string): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  
  // Saved resource operations
  getSavedResources(userId: number): Promise<SavedResource[]>;
  saveResource(savedResource: InsertSavedResource): Promise<SavedResource>;
  unsaveResource(userId: number, resourceId: number): Promise<boolean>;
  
  // Chat room operations
  getChatRooms(): Promise<ChatRoom[]>;
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  
  // Chat message operations
  getChatMessages(roomId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Appointment operations
  getAppointments(userId?: number, role?: 'student' | 'counselor'): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, status: 'scheduled' | 'canceled' | 'completed'): Promise<Appointment | undefined>;
  
  // Available slot operations
  getAvailableSlots(counselorId?: number): Promise<AvailableSlot[]>;
  getAvailableSlot(id: number): Promise<AvailableSlot | undefined>;
  createAvailableSlot(slot: InsertAvailableSlot): Promise<AvailableSlot>;
  updateAvailableSlot(id: number, isBooked: boolean): Promise<AvailableSlot | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assessmentQuestions: Map<number, AssessmentQuestion>;
  private assessmentSubmissions: Map<number, AssessmentSubmission>;
  private resources: Map<number, Resource>;
  private savedResources: Map<number, SavedResource>;
  private chatRooms: Map<number, ChatRoom>;
  private chatMessages: Map<number, ChatMessage>;
  private appointments: Map<number, Appointment>;
  private availableSlots: Map<number, AvailableSlot>;
  
  private currentIds: {
    users: number;
    assessmentQuestions: number;
    assessmentSubmissions: number;
    resources: number;
    savedResources: number;
    chatRooms: number;
    chatMessages: number;
    appointments: number;
    availableSlots: number;
  };

  constructor() {
    this.users = new Map();
    this.assessmentQuestions = new Map();
    this.assessmentSubmissions = new Map();
    this.resources = new Map();
    this.savedResources = new Map();
    this.chatRooms = new Map();
    this.chatMessages = new Map();
    this.appointments = new Map();
    this.availableSlots = new Map();
    
    this.currentIds = {
      users: 1,
      assessmentQuestions: 1,
      assessmentSubmissions: 1,
      resources: 1,
      savedResources: 1,
      chatRooms: 1,
      chatMessages: 1,
      appointments: 1,
      availableSlots: 1,
    };

    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create counselor account
    const counselor: InsertUser = {
      username: "00000001",
      password: "counselor123",
      role: "counselor"
    };
    this.createUser(counselor);
    
    // Create a default chat room
    const generalRoom: InsertChatRoom = {
      name: "General Discussion",
      description: "A place to discuss general mental health topics",
      type: "group",
      active: true
    };
    this.createChatRoom(generalRoom);
    
    // Create some default assessment questions
    const defaultQuestions: InsertAssessmentQuestion[] = [
      {
        question: "How often do you feel overwhelmed by your academic workload?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        category: "Academic Stress",
        weight: 2,
        createdBy: 1,
        active: true
      },
      {
        question: "How would you rate your overall mood in the past week?",
        options: ["Very Poor", "Poor", "Neutral", "Good", "Excellent"],
        category: "Mood",
        weight: 1,
        createdBy: 1,
        active: true
      },
      {
        question: "Do you have trouble sleeping due to stress or anxiety?",
        options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
        category: "Anxiety",
        weight: 2,
        createdBy: 1,
        active: true
      }
    ];
    
    defaultQuestions.forEach(q => this.createAssessmentQuestion(q));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Assessment operations
  async getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
    return Array.from(this.assessmentQuestions.values())
      .filter(q => q.active);
  }

  async getAssessmentQuestion(id: number): Promise<AssessmentQuestion | undefined> {
    return this.assessmentQuestions.get(id);
  }

  async createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const id = this.currentIds.assessmentQuestions++;
    const now = new Date();
    const newQuestion: AssessmentQuestion = { ...question, id, createdAt: now };
    this.assessmentQuestions.set(id, newQuestion);
    return newQuestion;
  }

  async updateAssessmentQuestion(id: number, question: Partial<InsertAssessmentQuestion>): Promise<AssessmentQuestion | undefined> {
    const existingQuestion = this.assessmentQuestions.get(id);
    if (!existingQuestion) return undefined;
    
    const updatedQuestion = { ...existingQuestion, ...question };
    this.assessmentQuestions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteAssessmentQuestion(id: number): Promise<boolean> {
    const existingQuestion = this.assessmentQuestions.get(id);
    if (!existingQuestion) return false;
    
    // Soft delete by marking as inactive
    existingQuestion.active = false;
    this.assessmentQuestions.set(id, existingQuestion);
    return true;
  }

  // Assessment submission operations
  async getAssessmentSubmissions(userId?: number): Promise<AssessmentSubmission[]> {
    const submissions = Array.from(this.assessmentSubmissions.values());
    if (userId) {
      return submissions.filter(s => s.userId === userId);
    }
    return submissions;
  }

  async getAssessmentSubmission(id: number): Promise<AssessmentSubmission | undefined> {
    return this.assessmentSubmissions.get(id);
  }

  async createAssessmentSubmission(submission: InsertAssessmentSubmission): Promise<AssessmentSubmission> {
    const id = this.currentIds.assessmentSubmissions++;
    const now = new Date();
    const newSubmission: AssessmentSubmission = { ...submission, id, createdAt: now };
    this.assessmentSubmissions.set(id, newSubmission);
    return newSubmission;
  }

  async getFlaggedSubmissions(): Promise<AssessmentSubmission[]> {
    return Array.from(this.assessmentSubmissions.values())
      .filter(s => s.flagged);
  }

  // Resource operations
  async getResources(category?: string): Promise<Resource[]> {
    const resources = Array.from(this.resources.values())
      .filter(r => r.active);
      
    if (category) {
      return resources.filter(r => r.category === category);
    }
    return resources;
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.currentIds.resources++;
    const now = new Date();
    const newResource: Resource = { ...resource, id, createdAt: now };
    this.resources.set(id, newResource);
    return newResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const existingResource = this.resources.get(id);
    if (!existingResource) return undefined;
    
    const updatedResource = { ...existingResource, ...resource };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    const existingResource = this.resources.get(id);
    if (!existingResource) return false;
    
    // Soft delete by marking as inactive
    existingResource.active = false;
    this.resources.set(id, existingResource);
    return true;
  }

  // Saved resource operations
  async getSavedResources(userId: number): Promise<SavedResource[]> {
    return Array.from(this.savedResources.values())
      .filter(sr => sr.userId === userId);
  }

  async saveResource(savedResource: InsertSavedResource): Promise<SavedResource> {
    const id = this.currentIds.savedResources++;
    const now = new Date();
    const newSavedResource: SavedResource = { ...savedResource, id, createdAt: now };
    this.savedResources.set(id, newSavedResource);
    return newSavedResource;
  }

  async unsaveResource(userId: number, resourceId: number): Promise<boolean> {
    const savedResource = Array.from(this.savedResources.values())
      .find(sr => sr.userId === userId && sr.resourceId === resourceId);
      
    if (!savedResource) return false;
    
    this.savedResources.delete(savedResource.id);
    return true;
  }

  // Chat room operations
  async getChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values())
      .filter(r => r.active);
  }

  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }

  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> {
    const id = this.currentIds.chatRooms++;
    const now = new Date();
    const newRoom: ChatRoom = { ...room, id, createdAt: now };
    this.chatRooms.set(id, newRoom);
    return newRoom;
  }

  // Chat message operations
  async getChatMessages(roomId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentIds.chatMessages++;
    const now = new Date();
    const newMessage: ChatMessage = { ...message, id, createdAt: now };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }

  // Appointment operations
  async getAppointments(userId?: number, role?: 'student' | 'counselor'): Promise<Appointment[]> {
    const appointments = Array.from(this.appointments.values());
    
    if (userId && role) {
      if (role === 'student') {
        return appointments.filter(a => a.studentId === userId);
      } else {
        return appointments.filter(a => a.counselorId === userId);
      }
    }
    
    return appointments;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentIds.appointments++;
    const now = new Date();
    const newAppointment: Appointment = { ...appointment, id, createdAt: now };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: number, status: 'scheduled' | 'canceled' | 'completed'): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) return undefined;
    
    existingAppointment.status = status;
    this.appointments.set(id, existingAppointment);
    return existingAppointment;
  }

  // Available slot operations
  async getAvailableSlots(counselorId?: number): Promise<AvailableSlot[]> {
    const slots = Array.from(this.availableSlots.values());
    
    if (counselorId) {
      return slots.filter(s => s.counselorId === counselorId);
    }
    
    return slots;
  }

  async getAvailableSlot(id: number): Promise<AvailableSlot | undefined> {
    return this.availableSlots.get(id);
  }

  async createAvailableSlot(slot: InsertAvailableSlot): Promise<AvailableSlot> {
    const id = this.currentIds.availableSlots++;
    const now = new Date();
    const newSlot: AvailableSlot = { ...slot, id, createdAt: now };
    this.availableSlots.set(id, newSlot);
    return newSlot;
  }

  async updateAvailableSlot(id: number, isBooked: boolean): Promise<AvailableSlot | undefined> {
    const existingSlot = this.availableSlots.get(id);
    if (!existingSlot) return undefined;
    
    existingSlot.isBooked = isBooked;
    this.availableSlots.set(id, existingSlot);
    return existingSlot;
  }
}

// We're replacing the MemStorage with PgStorage in the routes.ts file
// export const storage = new MemStorage();
