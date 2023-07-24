import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validateRoomId, validateName } from "@/libs/api-utils/utils";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();

export const POST = async (request: Request) => {
  const res = await request.json();

  const validate = validateName(res.name, 200);
  if (!validate.ok) {
    return NextResponse.json({ error: validate.res }, { status: 400 });
  }

  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345678910-_~", 5);
  const code: string = nanoid();
  await prisma.rooms.create({
    data: {
      name: res.name,
      id: code,
    },
  });

  return NextResponse.json({ code: code });
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);

  let roomId = searchParams.get("id")?.toString();
  const validate = validateRoomId(roomId);
  if (!validate.ok) {
    return NextResponse.json({ error: validate.res }, { status: 400 });
  }

  const room = await prisma.rooms.findUnique({
    where: {
      id: roomId,
    },
  });
  if (!room) {
    return NextResponse.json({ error: `no room found with id '${roomId}'` }, { status: 404 });
  }

  const users = await prisma.users.findMany({
    where: {
      roomId: roomId,
    },
  });

  return NextResponse.json({
    room: room,
    users: users,
  });
};
