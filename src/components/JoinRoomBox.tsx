import React, { useState } from "react";

import { generateName } from "../libs/utils/names";
import DiceIcon from "./DiceIcon";

export interface JoinRoomBoxProps {
  toggle: () => void;
}

export const JoinRoomBox: React.FC<JoinRoomBoxProps> = ({
  toggle: toggleShowCreate,
}) => {
  const [username, setUsername] = useState("");
  const [roomID, setRoomID] = useState("");

  const handleChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
  };

  const handleChangeRoomID = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRoomID(value);
  };

  const handleGenerateRandomUsername = () => {
    setUsername(generateName());
  };

  return (
    <div className="max-w-[30rem] w-full bg-white shadow-lg p-4 rounded">
      <div className="flex">
        <input
          className="bg-gray-100 py-1.5 px-2 w-full rounded-sm outline-none"
          placeholder="Room ID"
          onChange={handleChangeRoomID}
          value={roomID}
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
        <button className="w-full h-9 py-1 px-2 bg-brand-purple-200 hover:bg-brand-purple-100 text-brand-blue-800 rounded">
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
