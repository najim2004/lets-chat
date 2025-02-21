import { NextResponse } from "next/server";
import { Types } from "mongoose";
import User from "@/models/user.model";
import Message from "@/models/message.model";
import Chat from "@/models/chat.model";
import { ContactDetails } from "../../types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

async function getContactDetails(
  friendId: Types.ObjectId,
  userId: string
): Promise<ContactDetails | null> {
  const [friend, chat] = await Promise.all([
    User.findById(friendId).select("_id username email avatar").lean(),
    Chat.findOne({
      participants: { $all: [userId, friendId] }
    })
  ]);

  if (!friend) return null;

  const unreadCount = chat
    ? await Message.countDocuments({
        chatId: chat._id,
        sender: friendId,
        isRead: false,
        deletedFor: { $ne: userId }
      })
    : 0;

  return {
    id: friend._id?.toString(),
    name: friend.username,
    email: friend.email,
    avatar: friend.avatar,
    lastMessage: chat?.lastMessage ?? "Let's chat!",
    unread: unreadCount,
    chatId: chat?._id?.toString()
  };
}

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse<ContactDetails[]>>> {
  try {
    const userId = request.headers.get("user_id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized Access" },
        { status: 401 }
      );
    }

    const user = await User.findById(userId).select("friends");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const contacts = await Promise.all(
      user.friends.map((friendId) => getContactDetails(friendId, userId))
    );

    return NextResponse.json({
      success: true,
      data: contacts.filter((contact): contact is ContactDetails => contact !== null)
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

interface AddContactRequest {
  friendId: string;
}

export async function PUT(
  request: Request
): Promise<NextResponse<ApiResponse<ContactDetails>>> {
  try {
    const userId = request.headers.get("user_id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized Access" },
        { status: 401 }
      );
    }

    const { friendId }: AddContactRequest = await request.json();

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!user || !friend) {
      return NextResponse.json(
        { success: false, message: "User or friend not found" },
        { status: 404 }
      );
    }

    if (user.friends.includes(new Types.ObjectId(friendId))) {
      return NextResponse.json(
        { success: false, message: "Already in contacts" },
        { status: 400 }
      );
    }

    await Promise.all([
      User.findByIdAndUpdate(userId, { $push: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $push: { friends: userId } }),
      Chat.create({
        participants: [userId, friendId],
        lastMessage: null
      })
    ]);

    const contactDetails = await getContactDetails(new Types.ObjectId(friendId), userId);
    if (!contactDetails) {
      throw new Error("Failed to create contact");
    }

    return NextResponse.json({
      success: true,
      data: contactDetails,
      message: "Contact added"
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

interface DeleteContactRequest {
  friendId: string;
}

export async function DELETE(
  request: Request
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const userId = request.headers.get("user_id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized Access" },
        { status: 401 }
      );
    }

    const { friendId }: DeleteContactRequest = await request.json();

    const chat = await Chat.findOne({
      participants: { $all: [userId, friendId] }
    });

    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: userId } }),
      chat &&
        Message.updateMany(
          { chatId: chat._id },
          { $push: { deletedFor: userId } }
        )
    ]);

    return NextResponse.json({ success: true, message: "Contact removed" });
  } catch (error) {
    console.error("Error removing contact:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
