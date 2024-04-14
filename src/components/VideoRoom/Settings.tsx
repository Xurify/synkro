import React, { lazy, useState } from "react";
import { ClipboardCopyIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CHANGE_SETTINGS } from "@/constants/socketActions";

import { useToast } from "@/components/ui/use-toast";
import { useSocket } from "@/context/SocketContext";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { runIfAuthorized } from "@/libs/utils/socket";
import { generateUserIcon } from "@/libs/utils/chat";
import { deepEqual } from "@/libs/utils/frontend-utils";
import useAudio from "@/hooks/useAudio";
import { BUTTON_PRESS_AUDIO } from "@/constants/constants";

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
  const [privateRoom, setPrivateRoom] = useState<boolean>(!!room?.private);
  const [maxRoomSize, setMaxRoomSize] = useState<number>(room?.maxRoomSize ?? 10);
  const [roomPasscode, setRoomPasscode] = useState<string>(room?.passcode ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [_value, copy] = useCopyToClipboard();

  const { play: playButtonClickSound } = useAudio({
    volume: 0.5,
    src: BUTTON_PRESS_AUDIO,
  });

  const isAuthorized = socket?.isAdmin || room?.host === socket?.userId;

  const handleOnChangePrivateRoom = (checked: boolean) => {
    playButtonClickSound();
    setPrivateRoom(!checked);
  };

  const handleOnChangeMaxRoomSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxRoomSize(Number(e.target.value));
  };

  const handleOnChangeRoomPasscode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomPasscode(e.target.value);
  };

  const handleCopyPasscode = () => {
    if (!room?.passcode) return;
    room?.passcode &&
      copy(room.passcode).then(() => {
        toast({
          variant: "info",
          title: "Passcode successfully copied!",
          description: <span>Share it with someone you trust 🤫</span>,
        });
      });
  };

  const handleSaveSettings = () => {
    if (socket?.userId && room) {
      runIfAuthorized(
        room.host,
        socket.userId,
        () => {
          errorMessage && setErrorMessage(null);

          const newMaxRoomSize = room?.maxRoomSize === maxRoomSize ? undefined : maxRoomSize;

          const currentSettings = {
            private: room.private,
            maxRoomSize: room.maxRoomSize,
            roomPasscode: room.passcode,
          };

          const newSettings = {
            private: privateRoom,
            maxRoomSize,
            roomPasscode: roomPasscode.trim() || null,
          };

          const hasSettingsChanged = !deepEqual(currentSettings, newSettings);

          if (!hasSettingsChanged) return;

          if (newMaxRoomSize && newMaxRoomSize > 20) {
            setErrorMessage("Max room size cannot be larger than 20 characters");
            return;
          }

          socket.emit(CHANGE_SETTINGS, newSettings);

          toast({
            variant: "success",
            title: "Success!",
            description: "Room settings have successfully been saved!",
          });
        },
        socket.isAdmin
      );
    }
  };

  const handleCloseUserModal = (userId: string | null) => {
    setIsUserModalOpen(userId);
  };

  return (
    <div className="flex flex-col flex-grow w-full h-full p-2 gap-4 hide-scrollbar">
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
      <div className="flex items-center gap-x-2 text-sm text-secondary-foreground">
        <Switch id="public-mode" checked={!privateRoom} onCheckedChange={handleOnChangePrivateRoom} />
        <Label htmlFor="public-mode">Public</Label>
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
          <Button aria-label="Copy to clipboard" disabled={!roomPasscode.trim()} onClick={handleCopyPasscode} className="w-12 rounded-r rounded-l-none">
            <span>
              <ClipboardCopyIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
        </div>
        {!!roomPasscode && room?.passcode !== roomPasscode && <span className="mt-0.5 block text-red-300">Unsaved</span>}
      </div>

      <Button disabled={!isAuthorized} onClick={handleSaveSettings} className="w-full rounded">
        Save
      </Button>
      {errorMessage && <span className="text-red-600">{errorMessage}</span>}
    </div>
  );
};

export default Settings;
