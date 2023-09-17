import React, { useState } from "react";

import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/router";

import { DicesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateName } from "@/libs/utils/names";
import { GetServerSideProps } from "next";
import { JOIN_ROOM_BY_INVITE } from "@/constants/socketActions";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export interface InvitePageProps {
  sessionToken: string;
}

export const InvitePage: React.FC<InvitePageProps> = () => {
  const [username, setUsername] = useState("");

  const router = useRouter();
  const [inviteCode, setInviteCode] = useState((router.query["id"] as string) ?? "");

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
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    socket?.emit(JOIN_ROOM_BY_INVITE, inviteCode, username, ({ success, roomId }) => {
      if (success) {
        router.push(`/room/${roomId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong",
          description: "Sorry, this room doesn't exist. 😥",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
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
