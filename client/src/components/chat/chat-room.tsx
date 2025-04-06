import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials, formatTime } from "@/lib/utils";
import { ChatMessage } from "@shared/types";

interface ChatRoomProps {
  roomId: number;
  roomName: string;
}

export default function ChatRoom({ roomId, roomName }: ChatRoomProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    isConnected, 
    messages, 
    typingUsers, 
    sendMessage,
    sendTyping
  } = useChat({ roomId, autoConnect: true });
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && isConnected) {
      sendMessage(message.trim());
      setMessage("");
      
      // Reset typing status
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      sendTyping(false);
      setIsTyping(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Handle typing status
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      sendTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(false);
      }
    }, 2000);
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-lg font-heading flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
            <i className="ri-chat-3-line"></i>
          </div>
          {roomName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center p-4">
              <div>
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-chat-smile-3-line text-2xl text-neutral-400"></i>
                </div>
                <h3 className="text-lg font-medium text-neutral-700 mb-2">No Messages Yet</h3>
                <p className="text-neutral-500 text-sm">
                  Be the first to start the conversation!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: ChatMessage) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.userId === user?.id ? "justify-end" : "justify-start"}`}
                >
                  {msg.userId !== user?.id && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-neutral-200 text-neutral-700 text-xs">
                        {getInitials(msg.username)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[80%] ${
                      msg.userId === user?.id
                        ? "bg-primary-light chat-bubble-counselor"
                        : "bg-neutral-100 chat-bubble-student"
                    }`}
                  >
                    {msg.userId !== user?.id && (
                      <div className="text-xs font-medium text-neutral-500 mb-1">
                        {msg.username}
                      </div>
                    )}
                    <p className="text-sm text-neutral-700">{msg.message}</p>
                    <span className="text-xs text-neutral-500 mt-1 block">
                      {formatTime(new Date(msg.createdAt))}
                    </span>
                  </div>
                  
                  {msg.userId === user?.id && (
                    <Avatar className="h-8 w-8 ml-2">
                      <AvatarFallback className="bg-primary text-white text-xs">
                        You
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center text-xs text-neutral-500 italic">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-1 h-1 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].username} is typing...` 
                    : `${typingUsers.length} people are typing...`}
                </div>
              )}
              
              <div ref={messageEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <form className="flex w-full gap-2" onSubmit={handleSendMessage}>
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={handleInputChange}
            disabled={!isConnected}
            className="flex-1"
          />
          <Button type="submit" disabled={!message.trim() || !isConnected}>
            <i className="ri-send-plane-fill mr-1"></i>
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
