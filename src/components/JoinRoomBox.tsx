import React, { useState } from "react";

import { useRouter } from "next/navigation";

import { DicesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import { CHECK_IF_ROOM_EXISTS, JOIN_ROOM } from "@/constants/socketActions";
import { useSocket } from "@/context/SocketContext";
import { generateName } from "@/libs/utils/names";

export interface JoinRoomBoxProps {
  toggle: () => void;
}

export const JoinRoomBox: React.FC<JoinRoomBoxProps> = ({ toggle: toggleShowCreate }) => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const { socket } = useSocket();
  const router = useRouter();
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
    setUsername(generateName());
  };

  const handleJoinRoom = React.useCallback(() => {
    if (!username.trim() || !roomId.trim()) return;

    socket?.emit(CHECK_IF_ROOM_EXISTS, roomId, (value) => {
      if (value === null) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong",
          description: "Sorry, this room doesn't exist. 😥",
        });
      } else {
        socket.emit(JOIN_ROOM, roomId, username, ({ success }) => {
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
        <div className="flex items-center justify-center my-4 max-w-[10rem] w-full">
          <div className="flex-grow border-b border-gray-500"></div>
          <span className="px-4 text-gray-500">or</span>
          <div className="flex-grow border-b border-gray-500"></div>
        </div>
        <Button className="w-full h-9 py-1 px-2 border" onClick={toggleShowCreate} variant="secondary">
          Create Room
        </Button>
      </div>
    </div>
  );
};

export default JoinRoomBox;
