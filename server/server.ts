import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import dbConnect from "../src/lib/db.ts";
import User from "../src/models/user.model.ts";
import dotenv from "dotenv";
dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(async () => {
  await dbConnect();
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // ✅ Store Online Users (userId -> socketId)
  const onlineUsers = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    const user_id = Array.isArray(socket?.handshake?.query?.user_id)
      ? socket?.handshake?.query?.user_id[0]
      : socket?.handshake?.query?.user_id || "";
    if (user_id) {
      onlineUsers.set(user_id, socket.id);
    }

    io.emit("getOnlineFriends", async () => {
      const user = await User.findById(user_id).select("friends").lean();

      if (user?.friends) {
        const onlineFriends = user.friends.filter((friendId) =>
          onlineUsers.has(friendId.toString())
        );
        return onlineFriends;
      }
      return [];
    });

    // ✅ Handle user online event
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys())); // Send online users list

    // ✅ Handle message event
    socket.on("message", async (data) => {
      const users = await User.find();
      io.emit("message", users);
    });

    // ✅ Handle disconnect event
    socket.on("disconnect", () => {
      onlineUsers.delete(user_id);
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys())); // Send online
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
