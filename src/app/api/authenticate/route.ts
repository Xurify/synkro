import { type NextRequest } from "next/server";

export const runtime = "edge";

export const GET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const adminToken = searchParams.get("admin_token");

  if (!adminToken) {
    return new Response("admin_token is required", {
      status: 400,
      statusText: "admin_token is required",
    });
  }

  const cookieValue = [
    `admin_token=${adminToken}`,
    "HttpOnly",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    "SameSite=Strict",
    `Max-Age=${3600 * 24 * 365}`,
    "Path=/",
  ].join("; ");

  return new Response("Token set successfully", {
    status: 200,
    statusText: "Token set successfully",
    headers: {
      "Set-Cookie": cookieValue,
    },
  });
};

export default GET;
