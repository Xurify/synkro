import React, { useState } from "react";

import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateName } from "@/libs/utils/names";
import { GetServerSideProps } from "next";
import { JOIN_ROOM_BY_INVITE } from "@/constants/socketActions";
import { useToast } from "@/components/ui/use-toast";

import useSound from "use-sound";
import DiceButton from "@/components/DiceButton";

export interface InvitePageProps {
  sessionToken: string;
}

export const InvitePage: React.FC<InvitePageProps> = () => {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState((router.query["id"] as string) ?? "");
  const [username, setUsername] = useState("");

  const { socket } = useSocket();
  const { toast } = useToast();

  const [playUserDisconnectedSound] = useSound("/next-assets/audio/button_press.mp3", { volume: 0.5 });

  const handleChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
  };

  const handleChangeInviteCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInviteCode(value);
  };

  const handleGenerateRandomUsername = () => {
    playUserDisconnectedSound();
    setUsername(generateName());
  };

  const handleJoinRoom = React.useCallback(() => {
    if (!inviteCode.trim()) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "Invite code is missing.",
      });
      return;
    } else if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "Username is missing.",
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
            <DiceButton className="ml-2" onClick={handleGenerateRandomUsername} />
          </div>
          <div className="mt-4 flex flex-col items-center justify-end">
            <Button className="w-full h-9 py-1 px-2 border uppercase" onClick={handleJoinRoom} variant="default">
              Join Room
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default InvitePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const sessionToken = context.req.cookies["session_token"] || null;
  const adminToken = context.req.cookies["admin_token"] || null;
  return {
    props: {
      sessionToken,
      adminToken,
    },
  };
};
