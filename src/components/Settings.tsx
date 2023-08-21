import React, { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CHANGE_VIDEO } from "@/constants/socketActions";

import { useToast } from "./ui/use-toast";
import { useSocket } from "@/context/SocketContext";
import { runIfAuthorized } from "@/libs/utils/socket";
import { Label } from "@radix-ui/react-label";

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const [newVideoInQueueUrl, setNewVideoInQueueUrl] = useState<string>("");

  const { toast } = useToast();
  const { socket, room } = useSocket();

  const isAuthorized = room?.host === socket?.userId;

  const handleOnChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVideoInQueueUrl(e.target.value);
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") return;
  };

  const handleSaveSettings = (newSettings: any) => {
    if (socket?.userId && room) {
      runIfAuthorized(room.host, socket.userId, () => {
        socket?.emit(CHANGE_VIDEO, newSettings);
      });
    }
  };

  // color: #ffffff;
  //   background-color: #6b2ed7;
  //   padding: 4px 10px;
  //   border-radius: 5px;
  //   text-transform: uppercase;
  //   font-size: 1em;
  //   text-align: center;
  //   border: 1px solid rgba(0, 0, 0, 0.1);
  //   box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.3), inset 0 -2px 3px #4d219b, 0 1px 1px #331567;

  return (
    <div className="flex flex-col flex-grow w-full h-full p-3 gap-4 hide-scrollbar">
      <div>
        {/* text-white p-2 rounded uppercase text-sm text-center ring-2 ring-[#6b2ed7] ring-inset */}
        {/* text-white p-2 rounded uppercase text-sm text-center bg-[#6b2ed7] ring-2 ring-[#6b2ed7] ring-inset */}
        <div className="text-white p-2 rounded uppercase text-sm text-center bg-[#6b2ed7] shadow-[inset_0_2px_3px_rgba(255,_255,_255,_0.3),_inset_0_-2px_3px_#4d219b,_0_1px_1px_#331567]">
          CONNECTED USERS: {room?.members.length}
        </div>

        <div>{room && Array.isArray(room?.members) && room.members.map((member) => <div>{member.username}</div>)}</div>
      </div>
      <div className="text-sm text-secondary-foreground">
        <Label htmlFor="max-room-size">Max Room Size</Label>
        <Input
          className="h-10 rounded-l rounded-r-none"
          id="max-room-size"
          type="text"
          value={newVideoInQueueUrl}
          onChange={handleOnChangeMessage}
          onKeyDown={handleOnKeyDown}
        />
      </div>
      <div className="text-sm text-secondary-foreground">
        <Label htmlFor="room-passcode">Room Passcode</Label>
        <Input
          className="h-10 rounded-l rounded-r-none"
          type="text"
          id="room-passcode"
          value={newVideoInQueueUrl}
          onChange={handleOnChangeMessage}
          onKeyDown={handleOnKeyDown}
        />
      </div>
      <Button onClick={handleSaveSettings} className="w-full h-10">
        Save
      </Button>
    </div>
  );
};

export default Settings;
