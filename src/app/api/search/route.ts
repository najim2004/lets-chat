import { NextResponse } from "next/server";
import User, { IUser } from "@/models/user.model"; // Assuming you have an IUser interface
import dbConnect from "@/lib/db";

interface SearchResponse {
  success: boolean;
  message: string;
  users?: Pick<IUser, "avatar" | "username" | "_id">[];
}

export async function POST(
  request: Request
): Promise<NextResponse<SearchResponse>> {
  try {
    const user_id = request?.headers.get("user_id");
    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized Access" },
        { status: 401 }
      );
    }
    await dbConnect();

    const { query: searchQuery } = (await request.json()) as { query: string };

    if (!searchQuery) {
      return NextResponse.json(
        {
          success: false,
          message: "Search query is required",
        },
        { status: 400 }
      );
    }

    const isValidObjectId = (id: string): boolean =>
      /^[0-9a-fA-F]{24}$/.test(id);

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
            { _id: isValidObjectId(searchQuery) ? searchQuery : null },
          ],
        },
        { _id: { $ne: user_id } }, // Exclude the requesting user
      ],
    })
      .select("avatar username _id")
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      message: "Users found successfully",
      users,
    });
  } catch (error) {
    console.error("User search error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
