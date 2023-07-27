import { NextRequest, NextResponse } from "next/server";
import { parse, serialize } from "cookie";
import { v4 as uuidv4 } from "uuid";

export const middleware = async (req: NextRequest): Promise<NextResponse> => {
  const currentSessionToken = req.headers.get("cookie");
  const cookies = parse(currentSessionToken || "");

  let sessionToken = cookies["session_token"];

  if (!sessionToken) {
    sessionToken = uuidv4();
    const res = NextResponse.next();
    res.headers.set(
      "Set-Cookie",
      serialize("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 24 * 365,
        path: "/",
      })
    );
    console.log("TOKEN", sessionToken);
    return res;
  }

  return NextResponse.next();
};
