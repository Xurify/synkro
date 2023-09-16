import { NextApiRequest, NextApiResponse } from "next";

export const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const adminToken = req.query.admin_token;

  if (!adminToken) {
    return res.status(400).json({ error: "admin_token is required" });
  }

  const cookieValue = [
    `admin_token=${adminToken}`,
    "HttpOnly",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    "SameSite=Strict",
    `Max-Age=${3600 * 24 * 365}`,
    "Path=/",
  ].join("; ");

  res.setHeader("Set-Cookie", cookieValue);
  res.status(200).json({ message: "Token set successfully" });
};

export default handler;
