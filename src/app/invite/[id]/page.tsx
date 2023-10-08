"use client";

import React, { useState } from "react";

import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";

import { DicesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateName } from "@/libs/utils/names";
import { JOIN_ROOM_BY_INVITE } from "@/constants/socketActions";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export interface InvitePageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function InvitePage({ params }: InvitePageProps) {
  const [username, setUsername] = useState("");

  const router = useRouter();

  const inviteCodeParam = params?.["id"] as string;

  const [inviteCode, setInviteCode] = useState(inviteCodeParam ?? "");

  const { socket } = useSocket();
  const { toast } = useToast();

  const handleChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
  };

  const handleChangeInviteCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInviteCode(value);
  };

  const handleGenerateRandomUsername = () => {
    setUsername(generateName());
  };

  const handleJoinRoom = React.useCallback(() => {
    if (!username.trim() || !inviteCode.trim()) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "There seem to be missing fields",
      });
      return;
    }

    socket?.emit(JOIN_ROOM_BY_INVITE, inviteCode, username, ({ success, roomId, error }) => {
      if (success) {
        router.push(`/room/${roomId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong",
          description: error || "Sorry, this room doesn't exist. 😥",
        });
      }
    });
  }, [username, inviteCode]);

  return (
    <main className="flex flex-col">
      <div className="w-full h-full flex flex-col items-center justify-center px-2">
        <div className="max-w-[30rem] w-full bg-card p-4 rounded">
          <div className="flex">
            <Input placeholder="Invite code" onChange={handleChangeInviteCode} value={inviteCode} />
          </div>
          <div className="flex mt-3">
            <Input placeholder="Username" onChange={handleChangeUsername} value={username} />
            <Button
              className="w-9 h-9 min-w-[2.25rem] text-primary hover:bg-primary hover:text-white ml-2"
              onClick={handleGenerateRandomUsername}
              variant="secondary"
            >
              <span>
                <DicesIcon size="1.4rem" />
              </span>
            </Button>
          </div>
          <div className="mt-4 flex flex-col items-center justify-end">
            <Button className="w-full h-9 py-1 px-2 border" onClick={handleJoinRoom} variant="default">
              Join Room
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
