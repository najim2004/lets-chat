import User from "@/models/user.model";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

// GET - Fetch friends
export async function GET(request: Request) {
  try {
    const _id = request.headers.get("user_id");

    const user = await User.findById(_id).select("friends");
    if (!user)
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );

    const friends = await User.find({ _id: { $in: user.friends } }).select(
      "_id username email avatar"
    );
    return NextResponse.json({ success: true, friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// POST (Add) - Add Friend to friends
export async function POST_ADD(request: Request) {
  try {
    const { friendId } = await request.json(); // Get friend ID from request
    const _id = request.headers.get("user_id");

    const [user, friend] = await Promise.all([
      User.findById(_id),
      User.findById({ _id: friendId }),
    ]);
    if (!user || !friend)
      return NextResponse.json(
        { success: false, message: "User or Friend not found" },
        { status: 404 }
      );

    if (user.friends.includes(friendId))
      return NextResponse.json(
        { success: false, message: "Already friends" },
        { status: 400 }
      );

    if (_id) {
      user.friends.push(friendId);
      friend.friends.push(new mongoose.Types.ObjectId(_id));
    }
    await Promise.all([user.save(), friend.save()]);

    return NextResponse.json({ success: true, message: "Friend added" });
  } catch (error) {
    console.error("Error adding friend:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// PATCH (Remove) - Remove Friend from friends
export async function PATCH(request: Request) {
  try {
    const { friendId } = await request.json(); 
    const _id = request.headers.get("user_id");

    const [user, friend] = await Promise.all([
      User.findById(_id),
      User.findById(friendId),
    ]);
    if (!user || !friend)
      return NextResponse.json(
        { success: false, message: "User or Friend not found" },
        { status: 404 }
      );

    user.friends = user.friends.filter(
      (contact) => contact.toString() !== friendId
    );
    friend.friends = friend.friends.filter(
      (contact) => contact.toString() !== _id
    );

    await Promise.all([user.save(), friend.save()]);
    return NextResponse.json({ success: true, message: "Friend removed" });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
