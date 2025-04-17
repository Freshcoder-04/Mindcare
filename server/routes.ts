import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
// import { storage } from "./storage";
import { PgStorage } from "./pg-storage";
import { checkDbConnection } from "./db";

// Initialize PostgreSQL storage
const storage = new PgStorage();
import { WebSocketServer, WebSocket } from "ws";
import { analyzeAssessment, analyzeMood } from "./ai";
import { nanoid } from "nanoid";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import {
  insertUserSchema,
  insertAssessmentQuestionSchema,
  clientAssessmentSubmissionSchema,
  insertResourceSchema,
  insertChatRoomSchema,
  insertChatMessageSchema,
  insertAppointmentSchema,
  insertAvailableSlotSchema,
  insertSavedResourceSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// WebSocket clients store
interface Client {
  userId: number;
  socket: WebSocket;
  roomIds: number[];
}

const clients: Client[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Setup session
  const SessionStore = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'mindcare-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 }, // 24 hours
    store: new SessionStore({ checkPeriod: 86400000 })
  }));
  
  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: 'Invalid username' });
      }
      
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
  };
  
  const isCounselor = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === 'counselor') {
      return next();
    }
    res.status(403).json({ message: 'Not authorized' });
  };

  // Helper function to validate request body with zod schema
  function validateRequest<T>(schema: any, req: Request, res: Response): T | null {
    try {
      return schema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(400).json({ message: 'Invalid request data' });
      }
      return null;
    }
  }
  
  app.post('/api/auth/register', async (req, res) => {
    try {
      console.log("Registration request received:", req.body);
      const { password, role } = req.body;
      
      if (!password) {
        console.log("Registration error: Password is required");
        return res.status(400).json({ message: 'Password is required' });
      }
      
      // Ensure that role is either "student" or "counselor", defaulting to student
      const userRole = (role === "counselor" ? "counselor" : "student");
      
      // Get the current user count from the database
      const count = await storage.getUserCount();
      const username = (count + 1).toString().padStart(8, '0');
      console.log("Generated username:", username);
      
      const userData = {
        username,
        password,
        role: userRole,
      };
      
      console.log("Creating user with data:", { ...userData, password: '[REDACTED]' });
      const user = await storage.createUser(userData);
      console.log("User created successfully:", { id: user.id, username: user.username, role: user.role });
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login failed after registration:", err);
          return res.status(500).json({ message: 'Login failed after registration' });
        }
        console.log("User logged in successfully after registration");
        return res.status(201).json({
          user: { id: user.id, username: user.username, role: user.role },
          username: user.username,
        });
      });
    } catch (error) {
      console.error("Registration failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: 'Registration failed', error: message });
    }
  });
  
  
  // Login route
  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    const user = req.user as any;
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
  
  // Get current user
  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        isAuthenticated: true
      });
    }
    
    res.json({ isAuthenticated: false });
  });
  
  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  // ===== Assessment Routes =====
  
  // Get all assessment questions
  app.get('/api/assessment/questions', async (req, res) => {
    try {
      const questions = await storage.getAssessmentQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch assessment questions' });
    }
  });
  
  // Counselors: Create assessment question
  app.post('/api/assessment/questions', isCounselor, async (req, res) => {
    const user = req.user as any;
    const data = validateRequest(insertAssessmentQuestionSchema, req, res);
    if (!data) return;
    
    try {
      // Set the creator ID to the current counselor
      data.createdBy = user.id;
      
      const question = await storage.createAssessmentQuestion(data);
      res.status(201).json(question);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create assessment question' });
    }
  });
  
  // Counselors: Update assessment question
  app.put('/api/assessment/questions/:id', isCounselor, async (req, res) => {
    const { id } = req.params;
    
    try {
      const question = await storage.updateAssessmentQuestion(parseInt(id), req.body);
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update assessment question' });
    }
  });
  
  // Counselors: Delete assessment question
  app.delete('/api/assessment/questions/:id', isCounselor, async (req, res) => {
    const { id } = req.params;
    
    try {
      const success = await storage.deleteAssessmentQuestion(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      res.json({ message: 'Question deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete assessment question' });
    }
  });
  
  // Submit assessment
    // ─── Streaming Assessment Submission Endpoint ──────────────────────────────
    app.post(
      "/api/assessment/submit/stream",
      isAuthenticated,
      async (req: Request, res: Response) => {
        const user = req.user as any;
  
        // Validate only the client‑provided fields (responses)
        const data = validateRequest(clientAssessmentSubmissionSchema, req, res);
        if (!data) return;
        data.userId = user.id; // attach user
  
        // Pre‑fetch questions for context
        let questions;
        try {
          questions = await storage.getAssessmentQuestions();
        } catch (err) {
          console.error("Failed to load questions:", err);
          return res.status(500).json({ message: "Internal error" });
        }
  
        // SSE headers
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write("\n"); // send a first empty line to establish the stream
  
        try {
          for await (const chunk of streamAnalyzeAssessment(data, questions)) {
            // Final sentinel looks like JSON with "__STREAM_DONE"
            if (
              chunk.startsWith("{") &&
              chunk.includes("__STREAM_DONE")
            ) {
              const doneMeta = JSON.parse(chunk);
              // Persist to DB
              const submission = await storage.createAssessmentSubmission({
                ...data,
                score: doneMeta.score,
                feedback: doneMeta.feedback,
                flagged: doneMeta.flagged,
              });
  
              // Emit a custom “done” event with the new submission ID
              res.write(
                `event: done\ndata: ${JSON.stringify({
                  submissionId: submission.id,
                })}\n\n`
              );
  
              // Optionally close from server side
              res.write("event: close\n\n");
              return res.end();
            }
  
            // Stream each token
            // (we backslash-escape any newlines in the chunk)
            const safe = chunk.replace(/\n/g, "\\n");
            res.write(`data: ${safe}\n\n`);
          }
        } catch (streamErr) {
          console.error("Streaming error:", streamErr);
          res.write(
            `event: error\ndata: ${JSON.stringify({
              message: "AI streaming failed",
            })}\n\n`
          );
          return res.end();
        }
      }
    );
  
  app.post('/api/assessment/submit', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const data = validateRequest(clientAssessmentSubmissionSchema, req, res);
    if (!data) return;
    
    try {
      // Set the user ID to the current user
      data.userId = user.id;
      
      // Fetch all assessment questions to provide context for the AI analysis
      const questions = await storage.getAssessmentQuestions();
      
      // Analyze the responses with AI, passing both the submission and questions
      const { score, feedback, flagged } = await analyzeAssessment(data, questions);
      
      // Save the submission with the analysis results
      const submission = await storage.createAssessmentSubmission({
        ...data,
        score,
        feedback,
        flagged
      });
      
      res.status(201).json({
        id: submission.id,
        score,
        feedback,
        flagged
      });
    } catch (error) {
      console.error("Error submitting assessment:", error);
      res.status(500).json({ message: 'Failed to submit assessment' });
    }
  });
  
  // Get user's assessment submissions
  app.get('/api/assessment/submissions', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    try {
      const submissions = await storage.getAssessmentSubmissions(user.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch assessment submissions' });
    }
  });
  
  // Counselors: Get flagged assessment submissions
  app.get('/api/assessment/submissions/flagged', isCounselor, async (req, res) => {
    try {
      const submissions = await storage.getFlaggedSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch flagged submissions' });
    }
  });
  
  // ===== Resource Routes =====
  
  // Get all resources
  app.get('/api/resources', async (req, res) => {
    try {
      const { category } = req.query;
      const resources = await storage.getResources(category as string | undefined);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  });
  
  // Get a specific resource
  app.get('/api/resources/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      const resource = await storage.getResource(parseInt(id));
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch resource' });
    }
  });
  
  // Counselors: Create resource
  app.post('/api/resources', isCounselor, async (req, res) => {
    const user = req.user as any;
    const data = validateRequest(insertResourceSchema, req, res);
    if (!data) return;
    
    try {
      // Set the creator ID to the current counselor
      data.createdBy = user.id;
      
      const resource = await storage.createResource(data);
      res.status(201).json(resource);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create resource' });
    }
  });
  
  // Counselors: Update resource
  app.put('/api/resources/:id', isCounselor, async (req, res) => {
    const { id } = req.params;
    
    try {
      const resource = await storage.updateResource(parseInt(id), req.body);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update resource' });
    }
  });
  
  // Counselors: Delete resource
  app.delete('/api/resources/:id', isCounselor, async (req, res) => {
    const { id } = req.params;
    
    try {
      const success = await storage.deleteResource(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete resource' });
    }
  });
  
  // Save a resource (star/favorite)
  app.post('/api/resources/:id/save', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { id } = req.params;
    const resourceId = parseInt(id);
    
    try {
      // Check if resource exists
      const resource = await storage.getResource(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      // Save the resource
      const savedResource = await storage.saveResource({
        userId: user.id,
        resourceId
      });
      
      res.status(201).json(savedResource);
    } catch (error) {
      res.status(500).json({ message: 'Failed to save resource' });
    }
  });
  
  // Unsave a resource (unstar/unfavorite)
  app.delete('/api/resources/:id/save', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { id } = req.params;
    const resourceId = parseInt(id);
    
    try {
      const success = await storage.unsaveResource(user.id, resourceId);
      
      if (!success) {
        return res.status(404).json({ message: 'Saved resource not found' });
      }
      
      res.json({ message: 'Resource unsaved successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unsave resource' });
    }
  });
  
  // Get user's saved resources
  app.get('/api/resources/saved', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    try {
      const savedResources = await storage.getSavedResources(user.id);
      
      // Get the full resource details
      const resourceIds = savedResources.map(sr => sr.resourceId);
      const resources = await Promise.all(
        resourceIds.map(id => storage.getResource(id))
      );
      
      // Filter out any undefined resources
      res.json(resources.filter(Boolean));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch saved resources' });
    }
  });
  
  // ===== Chat Routes =====
  
  // Get all chat rooms
  app.get('/api/chat/rooms', isAuthenticated, async (req, res) => {
    try {
      const rooms = await storage.getChatRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat rooms' });
    }
  });
  
  // Get messages for a chat room
  app.get('/api/chat/rooms/:id/messages', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    
    try {
      const messages = await storage.getChatMessages(parseInt(id));
      
      // Get user details for each message
      const enrichedMessages = await Promise.all(
        messages.map(async (message) => {
          const user = await storage.getUser(message.userId);
          return {
            ...message,
            username: user?.username || 'Unknown'
          };
        })
      );
      
      res.json(enrichedMessages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  });
  
  // ===== Appointment Routes =====
  
  // Get available slots
  app.get('/api/appointments/slots', isAuthenticated, async (req, res) => {
    const { counselorId } = req.query;
    
    try {
      const slots = await storage.getAvailableSlots(
        counselorId ? parseInt(counselorId as string) : undefined
      );
      
      // Filter out slots that are already booked
      const availableSlots = slots.filter(slot => !slot.isBooked);
      
      res.json(availableSlots);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch available slots' });
    }
  });
  
  // Book an appointment
  app.post('/api/appointments', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { slotId, notes } = req.body;
    
    if (!slotId) {
      return res.status(400).json({ message: 'Slot ID is required' });
    }
    
    try {
      // Get the slot
      const slot = await storage.getAvailableSlot(parseInt(slotId));
      
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }
      
      if (slot.isBooked) {
        return res.status(400).json({ message: 'Slot is already booked' });
      }
      
      // Create appointment
      const appointment = await storage.createAppointment({
        studentId: user.id,
        counselorId: slot.counselorId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'scheduled',
        notes: notes || undefined
      });
      
      // Mark slot as booked
      await storage.updateAvailableSlot(slot.id, true);
      
      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to book appointment' });
    }
  });
  
  // Get user appointments
  app.get('/api/appointments', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    try {
      const appointments = await storage.getAppointments(user.id, user.role);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });
  
  // Cancel appointment
  app.put('/api/appointments/:id/cancel', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    
    try {
      const appointment = await storage.updateAppointment(parseInt(id), 'canceled');
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // Mark the slot as available again
      const slots = await storage.getAvailableSlots(appointment.counselorId);
      const matchingSlot = slots.find(slot => 
        slot.startTime.getTime() === appointment.startTime.getTime() &&
        slot.endTime.getTime() === appointment.endTime.getTime()
      );
      
      if (matchingSlot) {
        await storage.updateAvailableSlot(matchingSlot.id, false);
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to cancel appointment' });
    }
  });
  
  // Counselors: Add available slot
  app.post('/api/appointments/slots', isCounselor, async (req, res) => {
    const user = req.user as any;
    const data = validateRequest(insertAvailableSlotSchema, req, res);
    if (!data) return;
    
    try {
      // Set the counselor ID to the current counselor
      data.counselorId = user.id;
      
      const slot = await storage.createAvailableSlot(data);
      res.status(201).json(slot);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create available slot' });
    }
  });
  
  // Analyze mood
  app.post('/api/mood/analyze', isAuthenticated, async (req, res) => {
    const { mood } = req.body;
    
    if (!mood || typeof mood !== 'string') {
      return res.status(400).json({ message: 'Invalid mood provided' });
    }
    
    try {
      const response = await analyzeMood(mood);
      res.json({ response });
    } catch (error) {
      console.error("Error analyzing mood:", error);
      res.status(500).json({ message: 'Failed to analyze mood' });
    }
  });
  
  // WebSocket handling
  wss.on('connection', (socket) => {
    console.log('WebSocket client connected');
    
    let userId: number | null = null;
    
    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          const user = await storage.getUser(data.payload.userId);
          if (user) {
            userId = user.id;
            
            // Add to clients
            const client: Client = {
              userId: user.id,
              socket,
              roomIds: []
            };
            
            clients.push(client);
            
            socket.send(JSON.stringify({
              type: 'auth_success',
              payload: { userId: user.id }
            }));
          } else {
            socket.send(JSON.stringify({
              type: 'auth_error',
              payload: { message: 'User not found' }
            }));
          }
          return;
        }
        
        // Require authentication for all other message types
        if (userId === null) {
          socket.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Not authenticated' }
          }));
          return;
        }
        
        // Handle different message types
        switch (data.type) {
          case 'join_room': {
            const roomId = data.payload.roomId;
            const room = await storage.getChatRoom(roomId);
            
            if (!room) {
              socket.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room not found' }
              }));
              return;
            }
            
            // Find the client
            const client = clients.find(c => c.userId === userId);
            if (client && !client.roomIds.includes(roomId)) {
              client.roomIds.push(roomId);
            }
            
            socket.send(JSON.stringify({
              type: 'room_joined',
              payload: { roomId }
            }));
            break;
          }
          
          case 'leave_room': {
            const roomId = data.payload.roomId;
            
            // Find the client
            const client = clients.find(c => c.userId === userId);
            if (client) {
              client.roomIds = client.roomIds.filter(id => id !== roomId);
            }
            
            socket.send(JSON.stringify({
              type: 'room_left',
              payload: { roomId }
            }));
            break;
          }
          
          case 'chat_message': {
            const { roomId, message: messageText } = data.payload;
            
            if (!messageText || !roomId) {
              socket.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Invalid message data' }
              }));
              return;
            }
            
            // Get the room
            const room = await storage.getChatRoom(roomId);
            if (!room) {
              socket.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room not found' }
              }));
              return;
            }
            
            // Save the message
            const chatMessage = await storage.createChatMessage({
              roomId,
              userId: userId as number,
              message: messageText
            });
            
            // Get the sender's username
            const user = await storage.getUser(userId as number);
            
            // Broadcast to all clients in the same room
            const messageToSend = {
              type: 'chat_message',
              payload: {
                id: chatMessage.id,
                roomId,
                userId: chatMessage.userId,
                username: user?.username || 'Unknown',
                message: messageText,
                createdAt: chatMessage.createdAt
              }
            };
            
            clients.forEach(client => {
              if (client.roomIds.includes(roomId) && client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(JSON.stringify(messageToSend));
              }
            });
            break;
          }
          
          case 'typing': {
            const { roomId, isTyping } = data.payload;
            
            // Get the user
            const user = await storage.getUser(userId as number);
            
            // Broadcast typing status to all clients in the same room
            const messageToSend = {
              type: 'typing',
              payload: {
                roomId,
                userId: userId as number,
                username: user?.username || 'Unknown',
                isTyping
              }
            };
            
            clients.forEach(client => {
              if (client.userId !== userId && client.roomIds.includes(roomId) && client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(JSON.stringify(messageToSend));
              }
            });
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        socket.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' }
        }));
      }
    });
    
    socket.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Remove from clients
      const index = clients.findIndex(client => client.userId === userId);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  });

  return httpServer;
}
