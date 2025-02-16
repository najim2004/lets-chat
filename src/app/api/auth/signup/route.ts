import connectToDatabase from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import { ApiResponse, UserRequest } from "../../types";

const handleError = (message: string, status: number): Response => {
  return new Response(JSON.stringify({ message, success: false }), { status });
};

export const POST = async (req: Request): Promise<Response> => {
  try {
    await connectToDatabase();
    const { username, email, password }: UserRequest = await req.json();

    if (!username || !email || !password) {
      return handleError("All fields are required", 400);
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return handleError("User already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    if (!newUser) {
      return handleError("Failed to create user", 500);
    }
    const response: ApiResponse = {
      message: "User created successfully",
      success: true,
    };

    return new Response(JSON.stringify(response), { status: 201 });
  } catch (error: any) {
    console.log(error);
    return handleError("Internal server error", 500);
  }
};
