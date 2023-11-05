import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const rooms = await prisma.room.findMany();

  return res.json({ rooms: rooms || [] });
};

export default handler;
