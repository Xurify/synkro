import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/navigation";

import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DiceButton from "@/components/DiceButton";
import { JOIN_ROOM_BY_INVITE } from "@/constants/socketActions";

export interface InvitePageProps {
  sessionToken: string;
  code: string;
}

export const InvitePage: React.FC<InvitePageProps> = ({ code }) => {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState(code ?? "");
  const [username, setUsername] = useState("");

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
    import("@/libs/utils/names").then((module) => {
      setUsername(module.generateName());
    });
  };

  const handleJoinRoom = React.useCallback(() => {
    console.log("handleJoinRoom", inviteCode, username, !inviteCode.trim(), !username.trim());
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
      console.log("handleJoinRoomJOIN_ROOM_BY_INVITE", success, roomId, error);
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
  const code = context.params?.["code"] || null;

  return {
    props: {
      code,
      sessionToken,
      adminToken,
    },
  };
};
