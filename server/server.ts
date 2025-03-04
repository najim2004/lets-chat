import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import dbConnect from "../src/lib/db.ts";
import User from "../src/models/user.model.ts";
import dotenv from "dotenv";
import Message from "../src/models/message.model.ts";
import Chat from "../src/models/chat.model.ts";
import { startSession, Types } from "mongoose";
dotenv.config();

type ObjectId = Types.ObjectId;

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

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
const updateNetwork = async (userId: string, io: Server) => {
  try {
    const userFriends = await getFriends(userId);
    if (onlineUsers.has(userId)) {
      const onlineFriends = userFriends.filter((id) => onlineUsers.has(id));
      io.to(onlineUsers.get(userId)!).emit("onlineFriends", onlineFriends);
    }
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

// Get contact details
const getContactDetails = async (
  friendIds: ObjectId | ObjectId[],
  userId: string,
  single: boolean = false
) => {
  const pipeline = [
    { $match: { _id: single ? friendIds : { $in: friendIds } } },
    {
      $lookup: {
        from: "chats",
        let: { friendId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$$friendId", "$participants"] },
                  { $in: [new Types.ObjectId(userId), "$participants"] },
                ],
              },
            },
          },
        ],
        as: "chat",
      },
    },
    { $unwind: "$chat" },
    {
      $lookup: {
        from: "messages",
        let: { chatId: "$chat._id", friendId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$chatId", "$$chatId"] },
                  { $eq: ["$sender", "$$friendId"] },
                  { $eq: ["$isRead", false] },
                ],
              },
            },
          },
          { $count: "unread" },
        ],
        as: "unreadCount",
      },
    },
    {
      $project: {
        id: { $toString: "$_id" },
        name: "$username",
        email: 1,
        avatar: 1,
        lastMessage: "$chat.lastMessage",
        unread: { $ifNull: [{ $arrayElemAt: ["$unreadCount.unread", 0] }, 0] },
        online: { $ifNull: ["$online", false] },
        chatId: { $toString: "$chat._id" },
      },
    },
  ];
  const result = await User.aggregate(pipeline);
  return single ? result[0] : result;
};

app.prepare().then(async () => {
  await dbConnect();
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    const userId = Array.isArray(socket.handshake.query.user_id)
      ? socket.handshake.query.user_id[0]
      : socket.handshake.query.user_id || "";

    if (userId) {
      onlineUsers.set(userId, socket.id);
      updateNetwork(userId, io);
    }
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat room: ${chatId}`);
    });

    socket.on("add_friend", async (friendId: string, callback) => {
      const session = await startSession();
      session.startTransaction();

      try {
        await Chat.create([{ participants: [userId, friendId] }], { session });
        await User.bulkWrite(
          [
            {
              updateOne: {
                filter: { _id: userId, friends: { $ne: friendId } },
                update: { $addToSet: { friends: friendId } },
              },
            },
            {
              updateOne: {
                filter: { _id: friendId, friends: { $ne: userId } },
                update: { $addToSet: { friends: userId } },
              },
            },
          ],
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        const [updatedContact, myContact] = await Promise.all([
          getContactDetails(new Types.ObjectId(friendId), userId, true),
          getContactDetails(new Types.ObjectId(userId), friendId, true),
        ]);

        const notify = (id: string, contact: any) =>
          io
            .to(onlineUsers.get(id)!)
            .emit("friend_added", { ...contact, online: onlineUsers.has(id) });
        notify(userId, updatedContact);
        notify(friendId, myContact);

        callback({ success: true, message: "Friend added successfully!" });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Add friend error:", error);
        callback({ success: false, message: "Failed to add friend!" });
      }
    });

    socket.on("message", async ({ chatId, message }, callback) => {
      try {
        // Create new message
        const newMessage = await Message.create({
          chatId,
          content: message,
          sender: userId,
          isRead: false,
          createdAt: new Date(),
        });

        // Emit message to chat room with full message details
        io.to(chatId).emit("message", {
          _id: newMessage._id,
          chatId,
          content: message,
          sender: userId,
          isRead: false,
          createdAt: newMessage.createdAt,
        });
        callback({ success: true, message: "Message send successfully!" });
      } catch (error) {
        console.error("Message sending error:", error);
        callback({ success: false, message: "Failed to send message!" });
      }
    });

    socket.on("disconnect", () => {
      if (userId) {
        onlineUsers.delete(userId);
        updateNetwork(userId, io);
        setTimeout(
          () => !onlineUsers.has(userId) && friendsCache.delete(userId),
          3600000
        );
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => console.log(`> Ready on http://${hostname}:${port}`));
});
