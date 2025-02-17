import { authMiddleware } from "@/middleware/auth.middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ["/api/user/:path*"],
};
