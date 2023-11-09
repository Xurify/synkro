import React, { useState } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DiceButton from "@/components/DiceButton";
import { useToast } from "@/components/ui/use-toast";

import { CHECK_IF_ROOM_EXISTS, JOIN_ROOM } from "@/constants/socketActions";
import { useSocket } from "@/context/SocketContext";

export interface JoinRoomBoxProps {
  toggle: () => void;
}

export const JoinRoomBox: React.FC<JoinRoomBoxProps> = ({ toggle: toggleShowCreate }) => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const router = useRouter();
  const { socket } = useSocket();
  const { toast } = useToast();

  const handleChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
  };

  const handleChangeRoomId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRoomId(value);
  };

  const handleGenerateRandomUsername = () => {
    import("@/libs/utils/names").then((module) => {
      setUsername(module.generateName());
    });
  };

  const handleJoinRoom = React.useCallback(() => {
    console.log("handleJoinRoom", roomId, username, !roomId.trim(), !username.trim(), socket);
    if (!roomId.trim()) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "Room Id is missing.",
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

    socket?.emit(CHECK_IF_ROOM_EXISTS, roomId, (value) => {
      console.log("handleJoinRoomCHECK_IF_ROOM_EXISTS", roomId, username, value);
      if (value === null) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong",
          description: "Sorry, this room doesn't exist. 😥",
        });
      } else {
        socket.emit(JOIN_ROOM, roomId, username, ({ success }) => {
          console.log("handleJoinRoomJOIN_ROOM", roomId, success);
          success && router.push(`/room/${roomId}`);
        });
      }
    });
  }, [roomId, router, socket, username]);

  return (
    <div className="max-w-[30rem] w-full bg-card p-4 rounded">
      <div className="flex">
        <Input placeholder="Room Id" onChange={handleChangeRoomId} value={roomId} />
      </div>
      <div className="flex mt-3">
        <Input placeholder="Username" onChange={handleChangeUsername} value={username} />
        <DiceButton className="ml-2" onClick={handleGenerateRandomUsername} />
      </div>
      <div className="mt-4 flex flex-col items-center justify-end">
        <Button className="w-full h-9 py-1 px-2 border uppercase" onClick={handleJoinRoom} variant="default">
          Join Room
        </Button>
        <Button className="w-full h-9 py-1 px-2 border uppercase mt-2" onClick={toggleShowCreate} variant="secondary">
          Create Room
        </Button>
        <div className="flex items-center justify-center my-4 max-w-[10rem] w-full">
          <div className="flex-grow border-b border-gray-300"></div>
          <span className="px-4 text-gray-300 text-sm">or</span>
          <div className="flex-grow border-b border-gray-300"></div>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 w-full h-9 py-1 px-2 border uppercase"
          href="/rooms"
        >
          Check out the Room Browser!
        </Link>
      </div>
    </div>
  );
};

export default JoinRoomBox;
