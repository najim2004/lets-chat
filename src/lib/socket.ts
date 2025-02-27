import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_API_URL;

export const socket: Socket = io(SOCKET_SERVER_URL, {
  autoConnect: false, 
  transports: ["websocket"], 
  reconnectionAttempts: 5, 
  reconnectionDelay: 1000, 
});
