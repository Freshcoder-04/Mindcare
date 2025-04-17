import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "@/components/layout/page-layout";
import ChatRoom from "@/components/chat/chat-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatRoom as ChatRoomType } from "@shared/types";
import { Link } from "react-router-dom";
import { useEffect} from "react";

export default function Chat() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  
  // Fetch chat rooms
  // const { data: chatRooms, isLoading } = useQuery({
  //   queryKey: ['/api/chat/rooms'],
  //   queryFn: async () => {
  //     const res = await fetch('/api/chat/rooms', { credentials: "include" });
  //     if (!res.ok) throw new Error("Failed to fetch chat rooms");
  //     return res.json();
  //   },
  // });
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
      const loadRooms = async () => {
        try {
          const res = await fetch("/api/chat/rooms", { credentials: "include" });
          const data = await res.json();
          setChatRooms(data);
        } catch (err) {
          console.error("Failed to load chat rooms", err);
        } finally {
          setIsLoading(false);
        }
      };
    
      loadRooms();
    }, []);
  
    const [availableRooms, setAvailableRooms] = useState<ChatRoomType[] | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      const res = await fetch("/api/chat/rooms/available", { credentials: "include" });
      const data = await res.json();
      setAvailableRooms(data);
    };

    fetchRooms();
  }, []);



    useEffect(() => {
      const socket = new WebSocket("ws://localhost:8080/ws");
    
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "new-room") {
            const newRoom: ChatRoomType = msg.payload;
    
            setChatRooms((prev) => {
              const exists = prev.find((r) => r.id === newRoom.id);
              return exists ? prev : [...prev, newRoom];
            });
          }

          if (msg.type === "user-joined") {
            console.log(`User ${msg.payload.userId} joined room ${msg.payload.roomId}`);
            // Optionally show a toast or update UI
          }
        } catch (err) {
          console.error("Invalid WebSocket message", err);
        }
      };
    
      return () => socket.close();
    }, []);
    
  
  return (
    <PageLayout
      title="Chat Rooms"
      description="Connect anonymously with peers and counselors"
      headerContent={
        <>
          <Link to="/chat/create">
            <button className="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg">
              Create Room
            </button>
          </Link>
          <Link to="/chat/rooms/available">
            <button className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium px-4 py-2 rounded-lg">
              Join Room
            </button>
          </Link>
        </>
      }
    >

      <div className="h-[calc(100vh-13rem)] max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Chat Room List */}
          <div className="lg:col-span-1 h-full">
            <Card className="h-full">
              <div className="p-4 border-b">
                <h3 className="font-medium">Joined Rooms</h3>
              </div>
              
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : chatRooms?.length > 0 ? (
                <div className="divide-y">
                  {chatRooms.map((room: ChatRoomType) => (
                    <button
                      key={room.id}
                      className={`w-full text-left p-4 hover:bg-neutral-50 transition-colors ${
                        selectedRoom?.id === room.id ? "bg-primary-light" : ""
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                          <i className="ri-chat-3-line"></i>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{room.name}</div>
                          <div className="text-xs text-neutral-500">
                            {room.type === "group" ? "Group Chat" : "Direct Chat"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-chat-3-line text-2xl text-neutral-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-700 mb-2">No Chat Rooms</h3>
                  <p className="text-neutral-500 text-sm mb-4">
                    There are no active chat rooms available at the moment.
                  </p>
                </div>
              )}
            </Card>
          </div>
          
          {/* Chat Window */}
          <div className="lg:col-span-3 h-full">
            {selectedRoom ? (
              <ChatRoom 
                roomId={selectedRoom.id} 
                roomName={selectedRoom.name} 
              />
            ) : (
              <Card className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-chat-smile-3-line text-3xl text-neutral-400"></i>
                  </div>
                  <h3 className="text-xl font-medium text-neutral-700 mb-2">Select a Chat Room</h3>
                  <p className="text-neutral-500 mb-6 max-w-md">
                    Choose a chat room from the list to start an anonymous conversation with peers and counselors.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center text-sm text-neutral-600">
                      <i className="ri-shield-check-line mr-2 text-green-500"></i>
                      <span>Your identity remains anonymous</span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-neutral-600">
                      <i className="ri-chat-check-line mr-2 text-blue-500"></i>
                      <span>All messages are monitored by counselors</span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-neutral-600">
                      <i className="ri-emotion-happy-line mr-2 text-yellow-500"></i>
                      <span>Be respectful and supportive to others</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
