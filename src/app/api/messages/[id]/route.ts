import dbConnect from "@/lib/db";
import Message from "@/models/message.model";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Get chatId from params
  const {id:chatId} = params
  try {

    // Connect to MongoDB
    await dbConnect();

    // Validate chatId
    if (!chatId) {
      return NextResponse.json(
        { success: false, message: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Fetch messages with optimization
    const messages = await Message.find({ chatId })
      .select("_id chatId content sender createdAt") // Select only needed fields
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(50) // Limit results for pagination
      .lean(); // Convert to plain JavaScript objects for better performance

    return NextResponse.json(
      {
        success: true,
        data: messages,
        message: "Success to fetching messages",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
