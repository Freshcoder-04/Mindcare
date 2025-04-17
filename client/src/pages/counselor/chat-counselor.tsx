import { useEffect, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { ScrollArea , ScrollBar} from "@/components/ui/scroll-area";
type User = {
  id: number;
  username: string;
};
import { useLocation } from "wouter";
export default function CounselorChat() {

  const [, navigate] = useLocation();
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [searchId, setSearchId] = useState("");

  const filteredStudents = students.filter((student) =>
    student.id.toString().includes(searchId.trim())
  );
  
  

  const {
    messages,
    sendMessage,
    isConnected,
    connect,
    disconnect,
    loadMessages,
  } = useChat({ roomId: roomId || undefined, autoConnect: !!roomId });

  // Fetch students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      const res = await fetch("/api/users/students");
      const data = await res.json();
      setStudents(data);
    };

    fetchStudents();
  }, []);

  // Start chat or reuse existing room
  const startChat = async (student: User) => {
    const res = await fetch(`/api/chat/direct/${student.id}`, {
      method: "POST",
    });
    const room = await res.json();  
    setRoomId(room.id);
    setSelectedStudent(student);
  };

  return (

    
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-5rem)] p-4">
  {/* Sidebar - Student List */}
  <div className="lg:col-span-3 xl:col-span-2 bg-white border rounded-2xl overflow-auto shadow-sm">
    <div className="p-4 border-b font-medium flex items-center justify-between">
    {/* <span> </span> */}
    <button className="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg"
      onClick={() => navigate("/appointments")}
    >
      Appoinments
    </button>
      <span> </span>
    <button className="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg"
      onClick={() => navigate("/counselor/dashboard")}
    >
      Dashboard
    </button>
    
  </div>
    <div className="p-4 border-b font-medium text-lg">Students</div>
    <input
    type="text"
    placeholder="Search by ID"
    value={searchId}
    onChange={(e) => setSearchId(e.target.value)}
    className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
  />
    {/* </div> <ScrollArea className="h-full"> */}
    {/* <ul className="divide-y"> */}
      {/* {students.map((student) => (  */}
      <ScrollArea className="h-[calc(100%-5rem)]">
        <ul className="divide-y">
          {filteredStudents.map((student) => (
        <li key={student.id}>
          <button
            className={`w-full text-left px-4 py-3 transition hover:bg-neutral-100 ${
              selectedStudent?.id === student.id ? "bg-neutral-200" : ""
            }`}
            onClick={() => startChat(student)}
          >
            {student.username}
          </button>
        </li>
      ))}
    </ul>
    </ScrollArea>
  </div>

  {/* Chat Panel */}
  <div className="lg:col-span-9 xl:col-span-10 bg-white border rounded-2xl flex flex-col shadow-sm">
    {selectedStudent ? (
      <>
        <div className="p-4 border-b font-semibold text-lg">
          Chat with {selectedStudent.username}
        </div>

        {/* <div className="flex-1 overflow-y-auto p-4 space-y-4"> */}
        <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold">{msg.username}:</span> {msg.message}
            </div>
          ))}
        </div>
        </ScrollArea>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("message") as HTMLInputElement;
            if (input.value.trim()) {
              sendMessage(input.value);
              input.value = "";
            }
          }}
          className="p-4 border-t flex gap-3 bg-white"
        >
          <input
            type="text"
            name="message"
            className="flex-1 border border-neutral-300 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary/90 transition"
          >
            Send
          </button>
        </form>
      </>
    ) : (
      <div className="flex items-center justify-center h-full text-neutral-400">
        Select a student to begin chatting.
      </div>
    )}
  </div>
</div>
);
}
