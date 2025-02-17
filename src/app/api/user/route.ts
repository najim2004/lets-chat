import { NextResponse } from "next/server";
import User from "@/models/user.model";
import dbConnect from "@/lib/db";

// GET all users
export async function GET(request: Request) {
  const _id=request?.headers.get("user_id");
  try {
    await dbConnect();
    const users = await User.find({_id}, "-password");
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
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

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
