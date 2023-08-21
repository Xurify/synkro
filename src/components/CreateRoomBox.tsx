import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

import { generateName } from "../libs/utils/names";
import DiceIcon from "./DiceIcon";
import { JoinRoomBoxProps } from "./JoinRoomBox";
import { CREATE_ROOM } from "@/constants/socketActions";
import { useRouter } from "next/router";
import { useSocket } from "@/context/SocketContext";

export const CreateRoomBox: React.FC<JoinRoomBoxProps> = ({ toggle: toggleShowJoin }) => {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");

  const { toast } = useToast();

  const router = useRouter();
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
    setUsername(generateName());
  };

  const handleGenerateRandomRoomName = () => {
    setRoomName(`${generateName().split(" ")[0]} Room`);
  };

  const handleCreateRoom = () => {
    if (!username.trim()) return;

    socket?.emit(CREATE_ROOM, username, roomName, ({ result, error }) => {
      if (result && result.id) {
        router.push(`/room/${result.id}`);
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error,
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      }
    });
  };

  return (
    <div className="max-w-[30rem] w-full bg-card p-4 rounded">
      <div className="flex mb-3">
        <Input placeholder="Room name" onChange={handleChangeRoomName} value={roomName} />
        <Button
          className="w-9 h-9 min-w-[2.25rem] border border-brand-blue-800 text-primary hover:bg-primary hover:text-white ml-2"
          onClick={handleGenerateRandomRoomName}
          variant="secondary"
        >
          <span>
            <DiceIcon />
          </span>
        </Button>
      </div>
      <div className="flex">
        <Input placeholder="Username" onChange={handleChangeUsername} value={username} />
        <Button
          className="w-9 h-9 min-w-[2.25rem] border border-brand-blue-800 text-primary hover:bg-primary hover:text-white ml-2"
          onClick={handleGenerateRandomUsername}
          variant="secondary"
        >
          <span>
            <DiceIcon />
          </span>
        </Button>
      </div>
      <div className="mt-4 flex flex-col items-center justify-end">
        <Button className="w-full h-9 py-1 px-2 border" onClick={handleCreateRoom}>
          Create Room
        </Button>
        <div className="flex items-center justify-center my-4 max-w-[10rem] w-full">
          <div className="flex-grow border-b border-gray-500"></div>
          <span className="px-4 text-gray-500">or</span>
          <div className="flex-grow border-b border-gray-500"></div>
        </div>
        <Button className="w-full h-9 py-1 px-2 border" onClick={toggleShowJoin} variant="secondary">
          Join Room
        </Button>
      </div>
    </div>
  );
};

export default CreateRoomBox;
