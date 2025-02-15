import connectToDatabase from "@/lib/db";
import User from "@/models/user.model";
import bcrypt from "bcryptjs";

export const POST = async (req: Request) => {
  try {
    await connectToDatabase();
    const { username, email, password } = await req.json();

    // Validate input
    if (!username || !email || !password) {
      return new Response(
        JSON.stringify({
          message: "All fields are required",
        }),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({
          message: "User already exists",
        }),
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Something went wrong",
        error: error,
      }),
      { status: 500 }
    );
  }
};
export const GET = async (req: Request) => {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          message: "Email and password are required",
        }),
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });

    // If user doesn't exist
    if (!user) {
      return new Response(
        JSON.stringify({
          message: "Invalid credentials",
        }),
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({
          message: "Invalid credentials",
        }),
        { status: 401 }
      );
    }

    // Return user data if login successful
    return new Response(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Something went wrong",
        error: error,
      }),
      { status: 500 }
    );
  }
};
