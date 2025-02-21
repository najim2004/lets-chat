import { NextResponse } from "next/server";
import User from "@/models/user.model";
import dbConnect from "@/lib/db";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// GET all users
export async function GET(request: Request) {
  const _id = request?.headers.get("user_id");
  try {
    await dbConnect();
    const user = await User.find({ _id }, "-password");
    const response: ApiResponse<typeof user> = {
      success: true,
      data: user
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      message: "Failed to fetch user"
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT update user
export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, name, email, image } = body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, image },
      { new: true, select: "-password" }
    );

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      data: updatedUser
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      message: "Failed to update user"
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE user
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      const response: ApiResponse<null> = {
        success: false,
        message: "User ID is required"
      };
      return NextResponse.json(response, { status: 400 });
    }

    await User.findByIdAndDelete(id);

    const response: ApiResponse<null> = {
      success: true,
      data: null
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      message: "Failed to delete user"
    };
    return NextResponse.json(response, { status: 500 });
  }
}
