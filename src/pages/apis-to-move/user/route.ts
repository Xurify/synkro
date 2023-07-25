import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validateName, validateUserId, validateRoomId } from "@/libs/api-utils/utils";

const prisma = new PrismaClient();

export const POST = async (request: Request) => {
  const res = await request.json();

  const validatedName = validateName(res.name, 200);
  if (!validatedName.ok) {
    return NextResponse.json({ error: validatedName.res }, { status: 400 });
  }

  const validatedId = validateRoomId(res.roomId);
  if (!validatedId.ok) {
    return NextResponse.json({ error: validatedId.res }, { status: 400 });
  }

  const room = await prisma.rooms.findFirst({
    where: { id: res.roomId },
  });
  if (!room) {
    return NextResponse.json({ message: `Room with id '${res.roomId}' was not found` }, { status: 404 });
  }

  await prisma.users.create({
    data: {
      name: res.name,
      roomId: res.roomId,
    },
  });
  return NextResponse.json({ message: `Created user '${res.name}'` });
};

export const PATCH = async (request: Request) => {
  const res = await request.json();

  const validatedName = validateName(res.name, 200);
  if (!validatedName.ok) {
    return NextResponse.json({ error: validatedName.res }, { status: 400 });
  }

  const validatedId = validateUserId(res.id);
  if (!validatedId.ok) {
    return NextResponse.json({ error: validatedId.res }, { status: 400 });
  }
  const id = validatedId.value;

  await prisma.users.update({
    where: { id: id },
    data: {
      name: res.name,
    },
  });

  return NextResponse.json({ message: `Updated name to ${res.name}` });
};
