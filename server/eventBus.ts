type EventType = "message_sent" | "user_joined_room" | "user_typing" | "message_read" | "new_room" | "user_joined";
// Define the payloads for each event type

type EventPayloads = {
  message_sent: { roomId: string; message: string; senderId: string };
  user_joined_room: { roomId: string; userId: string };
  user_typing: { roomId: string; userId: string };
  message_read: { roomId: string; userId: string; messageId: string };
  new_room: { id: number; name: string; createdAt: Date|null };
  user_joined: { userId: string; roomId: number };
};

type HandlerMap = {
  [K in EventType]: Array<(payload: EventPayloads[K]) => void>;
};

class EventBus {
  private listeners: Partial<HandlerMap> = {};

  on<K extends EventType>(event: K, handler: (payload: EventPayloads[K]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [] as HandlerMap[K]; 
    }
    this.listeners[event]!.push(handler);
  }

  emit<K extends EventType>(event: K, payload: EventPayloads[K]) {
    this.listeners[event]?.forEach((handler) => handler(payload));
  }

  off<K extends EventType>(event: K, handler: (payload: EventPayloads[K]) => void) {
    const handlers = this.listeners[event];
    if (!handlers) return;
    this.listeners[event] = handlers.filter((h) => h !== handler) as HandlerMap[K];
  }
}

export const eventBus = new EventBus();
