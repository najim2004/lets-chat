import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token || token === "null") {
    return NextResponse.json(
      { success: false, message: "Unauthorized", redirect: "/login" },
      { status: 401 }
    );
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.NEXT_PUBLIC_JWT_SECRET!
    );
    const { payload } = await jwtVerify(token, secret);

    const response = NextResponse.next();
    response.headers.set("user_id", payload?._id?.toString() || "");

    return response;
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed" },
      { status: 401 }
    );
  }
}
