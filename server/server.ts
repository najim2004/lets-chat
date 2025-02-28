import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import dbConnect from "../src/lib/db.ts";
import User from "../src/models/user.model.ts";
import dotenv from "dotenv";
import Message from "../src/models/message.model.ts";
import Chat from "../src/models/chat.model.ts";
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
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Track online users and cache friends lists
  const onlineUsers = new Map<string, string>();
  const friendsCache = new Map<string, string[]>();

  // Get or fetch user's friends
  const getFriends = async (userId: string): Promise<string[]> => {
    if (!friendsCache.has(userId)) {
      const user = await User.findById(userId).select("friends").lean();
      if (user)
        friendsCache.set(
          userId,
          user.friends.map((id) => id.toString())
        );
    }
    return friendsCache.get(userId) || [];
  };

  // Update a user and their friends with online status
  const updateNetwork = async (userId: string) => {
    try {
      // Get user's friends
      const userFriends = await getFriends(userId);

      // If user is online, send them their online friends
      if (onlineUsers.has(userId)) {
        const onlineFriends = userFriends.filter((id) => onlineUsers.has(id));
        io.to(onlineUsers.get(userId)!).emit("onlineFriends", onlineFriends);
      }

      // Update each online friend with their own online friends
      await Promise.all(
        userFriends.map(async (friendId) => {
          if (onlineUsers.has(friendId)) {
            const friendsFriends = await getFriends(friendId);
            const friendsOnlineFriends = friendsFriends.filter((id) =>
              onlineUsers.has(id)
            );
            io.to(onlineUsers.get(friendId)!).emit(
              "onlineFriends",
              friendsOnlineFriends
            );
          }
        })
      );
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  io.on("connection", (socket) => {
    const userId =
      typeof socket.handshake.query.user_id === "string"
        ? socket.handshake.query.user_id
        : Array.isArray(socket.handshake.query.user_id)
        ? socket.handshake.query.user_id[0]
        : "";

    if (userId) {
      onlineUsers.set(userId, socket.id);
      updateNetwork(userId);
    }

    socket.on("send_message", async ({ chatId, message, sender }) => {
      try {
        // নতুন মেসেজ সেভ করো
        const newMessage = await Message.create({ chatId, message, sender });

        // Last message update
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message });

        // Realtime emit
        io.to(chatId).emit("update_last_message", {
          chatId,
          lastMessage: message,
        });
      } catch (error) {
        console.error("Message sending error:", error);
      }
    });

    socket.on("disconnect", () => {
      if (userId) {
        onlineUsers.delete(userId);
        updateNetwork(userId);

        // Clear cache if offline for a while
        setTimeout(() => {
          if (!onlineUsers.has(userId)) friendsCache.delete(userId);
        }, 3600000);
      }
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
