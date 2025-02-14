import { io, Socket } from "socket.io-client";

let socket: Socket;

export const initSocket = (userId: string) => {
  if (!socket) {
    socket = io({
      path: "/api/socket",
    });
    socket.emit("joinRoom", userId); // User joins their room
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initSocket() first.");
  }
  return socket;
};
