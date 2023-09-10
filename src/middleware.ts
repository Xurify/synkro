import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const middleware = async (req: NextRequest): Promise<NextResponse> => {
  let sessionToken = req.cookies.get("session_token")?.value;

  if (!sessionToken) {
    sessionToken = uuidv4();
    const res = NextResponse.next();
    res.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 24 * 365,
      path: "/",
    });
    return res;
  }

  return NextResponse.next();
};
