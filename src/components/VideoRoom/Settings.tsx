import React, { lazy, useState } from "react";
import { ClipboardCopyIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CHANGE_SETTINGS } from "@/constants/socketActions";

import { useToast } from "@/components/ui/use-toast";
import { useSocket } from "@/context/SocketContext";
import { runIfAuthorized } from "@/libs/utils/socket";

import { Label } from "../ui/label";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { generateUserIcon } from "@/libs/utils/chat";

const UserModal = lazy(() =>
  import("../Modals/UserModal").then((module) => {
    return { default: module.UserModal };
  })
);

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const { toast } = useToast();
  const { socket, room } = useSocket();

  const [isUserModalOpen, setIsUserModalOpen] = useState<string | null>(null);
  const [maxRoomSize, setMaxRoomSize] = useState<number>(room?.maxRoomSize ?? 10);
  const [roomPasscode, setRoomPasscode] = useState<string>(room?.passcode ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [_value, copy] = useCopyToClipboard();

  const isAuthorized = socket?.isAdmin || room?.host === socket?.userId;

  const handleOnChangeMaxRoomSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxRoomSize(Number(e.target.value));
  };

  const handleOnChangeRoomPasscode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomPasscode(e.target.value);
  };

  const handleCopyPasscode = () => {
    room?.passcode &&
      copy(room.passcode).then(() => {
        toast({
          variant: "info",
          title: "Passcode successfully copied!",
          description: <span>Share it with someone you trust 🤫</span>,
        });
      });
  };

  const handleSaveSettings = (newSettings: { maxRoomSize?: number; roomPasscode?: string }) => {
    if (socket?.userId && room) {
      runIfAuthorized(room.host, socket.userId, socket.isAdmin, () => {
        errorMessage && setErrorMessage(null);

        if (!newSettings.maxRoomSize && !newSettings.roomPasscode) return;
        if (newSettings.maxRoomSize === room.maxRoomSize && newSettings.roomPasscode === room.passcode) return;

        if (newSettings.maxRoomSize && newSettings.maxRoomSize > 20) {
          setErrorMessage("Max room size cannot be larger than 20 characters");
          return;
        }

        socket.emit(CHANGE_SETTINGS, newSettings);

        if (newSettings.maxRoomSize && newSettings.roomPasscode) {
          toast({
            variant: "default",
            title: "Success!",
            description: "Room settings have successfully been saved!",
          });
        } else {
          toast({
            variant: "default",
            title: "Success!",
            description: `${newSettings.maxRoomSize ? "Max room size" : "Room passcode"} updated!`,
          });
        }
      });
    }
  };

  const handleCloseUserModal = (userId: string | null) => {
    setIsUserModalOpen(userId);
  };

  return (
    <div className="flex flex-col flex-grow w-full h-full p-3 gap-4 hide-scrollbar">
      <div>
        {/* text-white p-2 rounded uppercase text-sm text-center ring-2 ring-[#6b2ed7] ring-inset */}
        {/* text-white p-2 rounded uppercase text-sm text-center bg-[#6b2ed7] ring-2 ring-[#6b2ed7] ring-inset */}
        <div className="">
          <div className="text-white font-semibold font-sans p-2 rounded uppercase text-sm text-center bg-[#6b2ed7] shadow-[inset_0_2px_3px_rgba(255,_255,_255,_0.3),_inset_0_-2px_3px_#4d219b,_0_1px_1px_#331567]">
            CONNECTED USERS: {room?.members.length}
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {room &&
              Array.isArray(room?.members) &&
              room.members.map((member, index) => (
                <React.Fragment key={`user-modal-button-${member.id}`}>
                  <UserModal
                    key={`user-modal-button-${member.id}-${index}`}
                    userId={member.id}
                    buttonText={
                      <div>
                        <span className="mr-1">{generateUserIcon(member.id, room.host, member?.isAdmin)}</span>
                        {member.username}
                      </div>
                    }
                    headerText={
                      <div>
                        User: <span className="text-primary">{member.username}</span>
                      </div>
                    }
                    disabled={member.isAdmin || !isAuthorized || member.id === socket?.userId}
                    open={isUserModalOpen === member.id}
                    handleToggle={handleCloseUserModal}
                  />
                </React.Fragment>
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
        {!!maxRoomSize && room?.maxRoomSize !== maxRoomSize && <span className="mt-0.5 block text-red-300">Unsaved</span>}
      </div>
      <div className="text-sm text-secondary-foreground">
        <Label htmlFor="room-passcode">Room Passcode</Label>
        <div className="flex items-center">
          <Input
            className=""
            disabled={!isAuthorized}
            type="password"
            id="room-passcode"
            value={roomPasscode}
            onChange={handleOnChangeRoomPasscode}
          />
          <Button onClick={handleCopyPasscode} className="w-12 rounded-r rounded-l-none">
            <span>
              <ClipboardCopyIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
        </div>
        {!!roomPasscode && room?.passcode !== roomPasscode && <span className="mt-0.5 block text-red-300">Unsaved</span>}
      </div>
      <Button
        onClick={() => handleSaveSettings({ roomPasscode, maxRoomSize: room?.maxRoomSize === maxRoomSize ? undefined : maxRoomSize })}
        className="w-full"
      >
        Save
      </Button>
      {errorMessage && <span className="text-red-600">{errorMessage}</span>}
    </div>
  );
};

export default Settings;
