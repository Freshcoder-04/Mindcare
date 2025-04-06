import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import { createWebSocketConnection } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@shared/types";

interface UseChatOptions {
  roomId?: number;
  autoConnect?: boolean;
}

export function useChat({ roomId, autoConnect = true }: UseChatOptions = {}) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ userId: number; username: string }[]>([]);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return;
    
    if (socket.current?.readyState === WebSocket.OPEN) return;
    
    socket.current = createWebSocketConnection();
    
    socket.current.onopen = () => {
      console.log("WebSocket connected");
      
      // Authenticate with WebSocket server
      if (socket.current && user) {
        socket.current.send(JSON.stringify({
          type: "auth",
          payload: { userId: user.id }
        }));
      }
    };
    
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "auth_success":
          setIsConnected(true);
          
          // Join room if roomId is provided
          if (roomId && socket.current) {
            socket.current.send(JSON.stringify({
              type: "join_room",
              payload: { roomId }
            }));
          }
          break;
          
        case "auth_error":
          toast({
            title: "Authentication Error",
            description: data.payload.message,
            variant: "destructive"
          });
          break;
          
        case "room_joined":
          toast({
            title: "Joined Chat Room",
            description: `You've joined the chat room successfully.`,
            duration: 3000
          });
          break;
          
        case "chat_message":
          if (data.payload.roomId === roomId) {
            setMessages((prev) => [...prev, data.payload]);
            
            // Remove user from typing list
            setTypingUsers((prev) => 
              prev.filter((user) => user.userId !== data.payload.userId)
            );
          }
          break;
          
        case "typing":
          if (data.payload.roomId === roomId) {
            if (data.payload.isTyping) {
              // Add user to typing list if not already there
              setTypingUsers((prev) => {
                if (prev.some((user) => user.userId === data.payload.userId)) {
                  return prev;
                }
                return [...prev, { 
                  userId: data.payload.userId, 
                  username: data.payload.username 
                }];
              });
            } else {
              // Remove user from typing list
              setTypingUsers((prev) => 
                prev.filter((user) => user.userId !== data.payload.userId)
              );
            }
          }
          break;
          
        case "error":
          toast({
            title: "Error",
            description: data.payload.message,
            variant: "destructive"
          });
          break;
      }
    };
    
    socket.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };
    
    socket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat server",
        variant: "destructive"
      });
    };
  }, [isAuthenticated, user, roomId, toast]);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socket.current) {
      // Leave room if roomId is provided
      if (roomId && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({
          type: "leave_room",
          payload: { roomId }
        }));
      }
      
      socket.current.close();
      socket.current = null;
      setIsConnected(false);
    }
  }, [roomId]);
  
  // Send message
  const sendMessage = useCallback((message: string) => {
    if (!roomId || !socket.current || !isConnected) return;
    
    socket.current.send(JSON.stringify({
      type: "chat_message",
      payload: {
        roomId,
        message
      }
    }));
  }, [roomId, isConnected]);
  
  // Send typing status
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!roomId || !socket.current || !isConnected) return;
    
    socket.current.send(JSON.stringify({
      type: "typing",
      payload: {
        roomId,
        isTyping
      }
    }));
  }, [roomId, isConnected]);
  
  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    }
  }, [roomId, toast]);
  
  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  
  // Load initial messages when roomId changes
  useEffect(() => {
    if (roomId) {
      loadMessages();
      
      // Join room if already connected
      if (isConnected && socket.current) {
        socket.current.send(JSON.stringify({
          type: "join_room",
          payload: { roomId }
        }));
      }
    }
    
    // Clear messages when roomId changes
    if (!roomId) {
      setMessages([]);
    }
  }, [roomId, isConnected, loadMessages]);
  
  return {
    isConnected,
    messages,
    typingUsers,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    loadMessages
  };
}
