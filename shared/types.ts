// Authentication-related types
export interface AuthResponse {
  user: {
    id: number;
    username: string;
    role: 'student' | 'counselor';
  };
  isAuthenticated: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  password: string;
}

// Assessment-related types
export interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  category: string;
  weight: number;
}

export interface AssessmentResponse {
  questionId: number;
  answer: number; // Index of the selected option
}

export interface AssessmentSubmission {
  userId: number;
  responses: Record<string, number>;
}

export interface AssessmentFeedback {
  score: number;
  feedback: string;
  flagged: boolean;
}

// Resource-related types
export interface ResourcePayload {
  title: string;
  description: string;
  content?: string;
  type: 'article' | 'video' | 'external_link';
  url?: string;
  category: string;
}

// Chat-related types
export interface ChatMessage {
  id: number;
  roomId: number;
  userId: number;
  username: string;
  message: string;
  createdAt: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  type: 'group' | 'direct';
  messageCount?: number;
}

// Appointment-related types
export interface AvailableSlot {
  id: number;
  counselorId: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface AppointmentPayload {
  studentId: number;
  counselorId: number;
  slotId: number;
  notes?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'chat_message' | 'typing' | 'join_room' | 'leave_room' | 'notification';
  payload: any;
}

export interface ChatMessagePayload {
  roomId: number;
  message: string;
}
