import { NextResponse } from "next/server";
import { Types } from "mongoose";
import User from "@/models/user.model";

// Types and Interfaces
type ObjectId = Types.ObjectId;

interface ContactDetails {
  id: string;
  name: string;
  email: string;
  avatar: string;
  lastMessage?: string;
  unread: number;
  online: boolean;
  chatId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Helper function to fetch contact details
async function getContactDetails(
  friendIds: ObjectId | ObjectId[],
  userId: string,
  single: boolean = false
): Promise<ContactDetails | ContactDetails[]> {
  const pipeline = [
    {
      $match: {
        _id: single ? friendIds : { $in: friendIds },
      },
    },
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

  const result = await User.aggregate<ContactDetails>(pipeline);
  return single ? result[0] : result;
}

function validateUser(
  userId: string | null
): { success: boolean; message: string } | null {
  if (!userId) return { success: false, message: "Unauthorized Access" };
  return null;
}

// API Endpoints
export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse<ContactDetails[]>>> {
  try {
    const userId = request.headers.get("user_id");
    const validationError = validateUser(userId);
    if (validationError) {
      return NextResponse.json(
        validationError as ApiResponse<ContactDetails[]>,
        { status: 401 }
      );
    }

    const user = await User.findById(userId).select("friends").lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" } as ApiResponse<
          ContactDetails[]
        >,
        { status: 404 }
      );
    }

    const contacts = (await getContactDetails(
      user.friends,
      userId as string
    )) as ContactDetails[];
    return NextResponse.json({ success: true, data: contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" } as ApiResponse<
        ContactDetails[]
      >,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request
): Promise<NextResponse<ApiResponse<ContactDetails>>> {
  try {
    const userId = request.headers.get("user_id");
    const validationError = validateUser(userId);
    if (validationError) {
      return NextResponse.json(validationError as ApiResponse<ContactDetails>, {
        status: 401,
      });
    }

    const { friendId }: { friendId: string } = await request.json();
    if (!friendId) {
      return NextResponse.json(
        {
          success: false,
          message: "Friend ID is required",
        } as ApiResponse<ContactDetails>,
        { status: 400 }
      );
    }

    await User.bulkWrite([
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
    ]);

    const updatedContact = (await getContactDetails(
      new Types.ObjectId(friendId),
      userId as string,
      true
    )) as ContactDetails;

    return NextResponse.json({ success: true, data: updatedContact });
  } catch (error) {
    console.error("Error adding contact:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      } as ApiResponse<ContactDetails>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
): Promise<NextResponse<ApiResponse<ContactDetails>>> {
  try {
    const userId = request.headers.get("user_id");
    const validationError = validateUser(userId);
    if (validationError) {
      return NextResponse.json(validationError as ApiResponse<ContactDetails>, {
        status: 401,
      });
    }

    const { friendId }: { friendId: string } = await request.json();
    if (!friendId) {
      return NextResponse.json(
        {
          success: false,
          message: "Friend ID is required",
        } as ApiResponse<ContactDetails>,
        { status: 400 }
      );
    }

    await User.bulkWrite([
      {
        updateOne: {
          filter: { _id: userId },
          update: { $pull: { friends: friendId } },
        },
      },
      {
        updateOne: {
          filter: { _id: friendId },
          update: { $pull: { friends: userId } },
        },
      },
    ]);

    return NextResponse.json({ success: true } as ApiResponse<ContactDetails>);
  } catch (error) {
    console.error("Error removing contact:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      } as ApiResponse<ContactDetails>,
      { status: 500 }
    );
  }
}
