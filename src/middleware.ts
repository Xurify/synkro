import { NextRequest, NextResponse, userAgent } from "next/server";
import { v4 as uuidv4 } from "uuid";

export const middleware = async (req: NextRequest): Promise<NextResponse> => {
  const { device } = userAgent(req);

  const res = NextResponse.next();

  const deviceType = device.type === "mobile" ? "mobile" : "desktop";
  res.cookies.set("device_type", deviceType, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600 * 24 * 365,
    path: "/",
  });

  let sessionToken = req.cookies.get("session_token")?.value;

  if (!sessionToken) {
    sessionToken = uuidv4();
    res.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 24 * 365,
      path: "/",
    });
    return res;
  }

  return res;
};
