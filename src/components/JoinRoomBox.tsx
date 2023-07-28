import React, { useState } from "react";

import { generateName } from "../libs/utils/names";
import DiceIcon from "./DiceIcon";
import { ClientToServerEvents, ServerToClientEvents } from "@/types/socketCustomTypes";
import { Socket } from "socket.io-client";
import { CHECK_IF_ROOM_EXISTS } from "@/constants/socketActions";
import { useRouter } from "next/router";

export interface JoinRoomBoxProps {
  toggle: () => void;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

export const JoinRoomBox: React.FC<JoinRoomBoxProps> = ({ toggle: toggleShowCreate, socket }) => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const router = useRouter();

  const handleChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
  };

  const handleChangeRoomID = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        alert("Sorry, this room doesn't exist 😥");
      } else {
        router.push(`/room/${roomId}`);
      }
    });
  }, [roomId, router, socket, username]);

  console.log("JOINROOMBOX", socket);

  return (
    <div className="max-w-[30rem] w-full bg-white shadow-lg p-4 rounded">
      <div className="flex">
        <input
          className="bg-gray-100 py-1.5 px-2 w-full rounded-sm outline-none"
          placeholder="Room ID"
          onChange={handleChangeRoomID}
          value={roomId}
        />
      </div>
      <div className="flex mt-3">
        <input
          className="bg-gray-100 py-1.5 px-2 w-full rounded-sm outline-none"
          placeholder="Username"
          onChange={handleChangeUsername}
          value={username}
        />
        <button
          className="w-9 h-9 min-w-[2.25rem] border border-brand-blue-800 text-brand-blue-800 hover:bg-brand-blue-800 hover:text-white rounded ml-2 flex items-center justify-center"
          onClick={handleGenerateRandomUsername}
        >
          <DiceIcon />
        </button>
      </div>
      <div className="mt-4 flex flex-col items-center justify-end">
        <button
          className="w-full h-9 py-1 px-2 bg-brand-purple-200 hover:bg-brand-purple-100 text-brand-blue-800 rounded"
          onClick={handleJoinRoom}
        >
          Join Room
        </button>
        <div className="flex items-center justify-center my-4 max-w-[10rem] w-full">
          <div className="flex-grow border-b border-gray-500"></div>
          <span className="px-4 text-gray-500">or</span>
          <div className="flex-grow border-b border-gray-500"></div>
        </div>
        <button
          className="max-w-[28rem] w-full h-9 py-1 px-2 border border-brand-blue-800 box-border bg-brand-blue-600 text-white rounded"
          onClick={toggleShowCreate}
        >
          Create Room
        </button>
      </div>
    </div>
  );
};

export default JoinRoomBox;
