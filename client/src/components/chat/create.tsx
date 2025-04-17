import { useState } from "react";
import PageLayout from "@/components/layout/page-layout";

export default function CreateRoomPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"group" | "direct">("group");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description, type }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("Room created successfully!");
      setName(""); setDescription("");
    } else {
      setMessage(data?.error || "Something went wrong.");
    }
  };

  return (
    <PageLayout title="Create a Room" description="Start a new chat room for others to join.">
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">Room Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "group" | "direct")}
            className="w-full border rounded px-3 py-2"
          >
            <option value="group">Group</option>
            <option value="direct">Direct</option>
          </select>
        </div>

        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">
          Create Room
        </button>

        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </PageLayout>
  );
}
