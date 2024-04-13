import React, { useState } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { useSocket } from "@/context/SocketContext";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiceButton } from "@/components/DiceButton";
import { JoinRoomBoxProps } from "@/components/JoinRoomBox";

import { CREATE_ROOM } from "@/constants/socketActions";

export const CreateRoomBox: React.FC<JoinRoomBoxProps> = ({ toggle: toggleShowJoin }) => {
  const [roomName, setRoomName] = useState("");
  const [username, setUsername] = useState("");

  const router = useRouter();
  const { toast } = useToast();
  const { socket } = useSocket();

  const handleChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
  };

  const handleChangeRoomName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRoomName(value);
  };

  const handleGenerateRandomUsername = () => {
    import("@/libs/utils/names").then((module) => {
      setUsername(module.generateName());
    });
  };

  const handleGenerateRandomRoomName = () => {
    import("@/libs/utils/names").then((module) => {
      setRoomName(`${module.generateName().split(" ")[0]} Room`);
    });
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "Room name is missing.",
      });
      return;
    } else if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "Username is missing.",
      });
      return;
    } else if (socket && !socket?.connected) {
      console.log('Socket is not connected', socket);
    }

    socket?.emit(CREATE_ROOM, username, roomName, ({ result, error }) => {
      if (result && result.id) {
        router.push(`/room/${result.id}`);
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong",
          description: error,
        });
      }
    });
  };

  return (
    <div className="max-w-[30rem] w-full bg-card p-4 rounded">
      <div className="flex mb-3">
        <Input placeholder="Room name" onChange={handleChangeRoomName} value={roomName} />
        <DiceButton className="ml-2" onClick={handleGenerateRandomRoomName} />
      </div>
      <div className="flex">
        <Input placeholder="Username" onChange={handleChangeUsername} value={username} />
        <DiceButton className="ml-2" onClick={handleGenerateRandomUsername} />
      </div>
      <div className="mt-4 flex flex-col items-center justify-end">
        <Button className="w-full h-9 py-1 px-2 border uppercase" onClick={handleCreateRoom}>
          Create Room
        </Button>
        <Button className="w-full h-9 py-1 px-2 border uppercase mt-2" onClick={toggleShowJoin} variant="secondary">
          Join Room
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

export default CreateRoomBox;
