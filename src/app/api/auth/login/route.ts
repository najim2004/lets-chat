import dbConnect from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRequest } from "../../types";
 interface ApiResponse {
  message: string;
  token?: string;
  success: boolean;
}

const handleError = (message: string, status: number): Response => {
  return new Response(JSON.stringify({ message, success: false }), { status });
};

export const POST = async (req: Request): Promise<Response> => {
  try {
    await dbConnect();
    const { email, password }: UserRequest = await req.json();

    if (!email || !password) {
      return handleError("Email and password are required", 400);
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return handleError("Invalid credentials", 401);
    }

    const token = jwt.sign(
      {
        _id: user._id?.toString(),
        username: user.username,
        email: user.email,
      },
      process.env.NEXT_PUBLIC_JWT_SECRET ?? "",
      { expiresIn: "1d" }
    );

    const response: ApiResponse = {
      message: "Login successful",
      token,
      success: true,
    };

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: any) {
    console.log(error);
    return handleError("Internal server error", 500);
  }
};
