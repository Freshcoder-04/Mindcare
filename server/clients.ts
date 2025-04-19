// WebSocket clients store
export interface Client {
    userId: number;
    socket: WebSocket;
    roomIds: number[];
  }
  
export  const clients: Client[] = [];