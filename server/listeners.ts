// listeners.ts
import { eventBus } from "./eventBus";
import { clients } from "./clients.ts";
import { WebSocket } from "ws";

eventBus.on("message_sent", ({ roomId, message, senderId }) => {
  console.log(`[message_sent] ${senderId} in ${roomId}: ${message}`);
  // Save to DB or trigger a webhook
});

eventBus.on("user_joined_room", ({ roomId, userId }) => {
  console.log(`[user_joined_room] ${userId} joined ${roomId}`);
  // Send a welcome message, notify others, etc.
});

eventBus.on("user_typing", ({ roomId, userId }) => {
  console.log(`[user_typing] ${userId} is typing in ${roomId}`);
});

eventBus.on("message_read", ({ roomId, userId, messageId }) => {
  console.log(`[message_read] ${userId} read ${messageId} in ${roomId}`);
});



eventBus.on("new_room", ({id, name, createdAt}) => {
  const message = JSON.stringify({ type: "new_room", payload: {id, name,createdAt} });

  clients.forEach(({ socket }) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  });
});

eventBus.on("user_joined", ({ userId, roomId }) => {
  const message = JSON.stringify({
    type: "user_joined",
    payload: { userId, roomId },
  });

  // clients.forEach(({ socket }) => 
  //   {
  //   if (socket.readyState === WebSocket.OPEN) 
  //     {
  //     socket.send(message);
  //   }
    
  // });
  clients.forEach((client) => {
    if (client.roomIds.includes(roomId) && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(message);
    }
  });
  
});