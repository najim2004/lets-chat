// pages/api/socket/socket.ts
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "socket.io";
import dbConnect from "@/lib/db";
import Chat from "@/models/chat.model";

interface ServerSocket extends HTTPServer {
  io?: SocketIOServer;
}

interface ResponseSocket extends NextApiResponse {
  socket: any & {
    server: ServerSocket;
  };
}

interface MessageData {
  senderId: string;
  recipientId: string;
  messageText: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  timestamp?: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: ResponseSocket
) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO...");
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
    });
    res.socket.server.io = io;

    io.on("connection", (socket: Socket) => {
      console.log("New client connected:", socket.id);

      // Event for sending a new message
      socket.on(
        "newMessage",
        async ({ senderId, recipientId, messageText }: MessageData) => {
          console.log(senderId, recipientId, messageText);
          try {
            await dbConnect();
            const chat = await Chat.findOne({
              participants: { $all: [senderId, recipientId] },
            });

            const newMessage: ChatMessage = {
              sender: senderId,
              text: messageText,
              timestamp: new Date(),
            };

            if (chat) {
              chat.messages.push(newMessage);
              await chat.save();
            } else {
              // Create new chat if it doesn't exist
              await Chat.create({
                participants: [senderId, recipientId],
                messages: [newMessage],
              });
            }

            io.to(recipientId).emit("receiveMessage", {
              ...newMessage,
              senderId,
            });
          } catch (error) {
            console.error("Error handling new message:", error);
            socket.emit("error", "Failed to process message");
          }
        }
      );

      // Join chat room when users are matched
      socket.on("joinRoom", (userId: string) => {
        socket.join(userId);
        console.log(`User with ID: ${userId} joined the room`);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }
  res.end();
}
