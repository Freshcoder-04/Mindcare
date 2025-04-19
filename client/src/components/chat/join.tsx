import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ChatRoom = {
  id: number;
  name: string;
  description?: string;
  type: "group" | "direct";
};

export default function AvailableRooms() {
  const [availableRooms, setAvailableRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/chat/rooms/available", {
          credentials: "include",
        });
        const data : ChatRoom[] = await res.json();
        console.log("Joinable rooms response:", data);
        const groupRooms = data.filter(room => room.type === "group");
        // setAvailableRooms(data);
        setAvailableRooms(groupRooms);

      } catch (err) {
        console.error("Failed to fetch joinable rooms", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleJoin = async (roomId: number) => {
    setJoiningRoomId(roomId);
    const res = await fetch(`/api/chat/rooms/${roomId}/join`, {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      setAvailableRooms((prev) => prev.filter((r) => r.id !== roomId));
      toast({
        title: "Joined room successfully",
        description: "You can now start chatting in this room!",
        duration: 3000,});
    } else {
      alert("Failed to join room.");
      toast({
        title: "Failed to join room",
        description: "Please try again or refresh the page.",
        variant: "destructive",
      });
    }

    setJoiningRoomId(null);
  };

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Joinable Chat Rooms</h2>
        </div>
  
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : !Array.isArray(availableRooms) ? (
          <div className="p-4 text-red-500">Failed to load rooms. Please try again later.</div>
        ) : availableRooms.length === 0 ? (
          <div className="p-4 text-neutral-500">No available rooms to join.</div>
        ) : (
          <ul className="divide-y">
            {availableRooms.map((room) => (
              <li key={room.id} className="flex justify-between items-center p-4">
                <div>
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-neutral-500">
                    {room.type === "group" ? "Group Chat" : "Direct Chat"}
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(room.id)}
                  disabled={joiningRoomId === room.id}
                  className="bg-primary hover:bg-primary-dark text-white text-sm px-4 py-2 rounded"
                >
                  {joiningRoomId === room.id ? "Joining..." : "Join"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );  
}
