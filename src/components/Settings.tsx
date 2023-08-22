import React, { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CHANGE_VIDEO } from "@/constants/socketActions";

import { useToast } from "@/components/ui/use-toast";
import { useSocket } from "@/context/SocketContext";
import { runIfAuthorized } from "@/libs/utils/socket";

import { UserModal } from "./UserModal";
import { User } from "@/types/interfaces";
import { Label } from "./ui/label";

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const [maxRoomSize, setMaxRoomSize] = useState<number>(20);
  const [roomPasscode, setRoomPasscode] = useState<string>("");

  const { toast } = useToast();
  const { socket, room } = useSocket();

  const isAuthorized = room?.host === socket?.userId;

  const handleOnChangeMaxRoomSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxRoomSize(Number(e.target.value));
  };

  const handleOnChangeRoomPasscode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomPasscode(e.target.value);
  };

  const handleSaveSettings = (newSettings: any) => {
    if (socket?.userId && room) {
      runIfAuthorized(room.host, socket.userId, () => {
        socket?.emit(CHANGE_VIDEO, newSettings);
        toast({
          variant: "default",
          title: "Success!",
          description: "Room settings have successfully been saved.",
        });
      });
    }
  };

  const generateUserIcon = (member: User, host: string) => {
    if (!member || !host) return null;
    return member.id === host && "👑";
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
        <div className="">
          <div className="text-white p-2 rounded uppercase text-sm text-center bg-[#6b2ed7] shadow-[inset_0_2px_3px_rgba(255,_255,_255,_0.3),_inset_0_-2px_3px_#4d219b,_0_1px_1px_#331567]">
            CONNECTED USERS: {room?.members.length}
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {room &&
              Array.isArray(room?.members) &&
              room.members.map((member) => (
                <UserModal
                  buttonText={
                    <div>
                      <span className="mr-1">{generateUserIcon(member, room.host)}</span>
                      {member.username}
                    </div>
                  }
                  headerText={
                    <div>
                      User: <span className="text-primary">{member.username}</span>
                    </div>
                  }
                  disabled={member.id === socket?.userId}
                />
              ))}
          </div>
        </div>
      </div>
      <div className="text-sm text-secondary-foreground">
        <Label htmlFor="max-room-size">Max Room Size</Label>
        <Input
          disabled={!isAuthorized}
          id="max-room-size"
          type="number"
          max={10}
          min={room?.members.length}
          value={maxRoomSize}
          onChange={handleOnChangeMaxRoomSize}
        />
      </div>
      <div className="text-sm text-secondary-foreground">
        <Label htmlFor="room-passcode">Room Passcode</Label>
        <Input disabled={!isAuthorized} type="text" id="room-passcode" value={roomPasscode} onChange={handleOnChangeRoomPasscode} />
      </div>
      <Button onClick={handleSaveSettings} className="w-full">
        Save
      </Button>
    </div>
  );
};

export default Settings;
