"use client";

import { useState } from "react";
import { QrCodeIcon, UserPlusIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/SocketContext";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { BASE_URL } from "@/constants/constants";
import { QRCodeModal } from "./QRCodeModal";

const convertInviteCodeToUrl = (inviteCode: string) => `${BASE_URL}/invite/${inviteCode}`;

export const VideoRoomHeader: React.FC = () => {
  const { room } = useSocket();
  const [_value, copy] = useCopyToClipboard();
  const { toast } = useToast();
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState<boolean>(false);

  const handleCopyInviteCode = () => {
    room?.inviteCode &&
      copy(convertInviteCodeToUrl(room.inviteCode)).then(() => {
        toast({
          variant: "info",
          description: <span>Invite link copied!</span>,
        });
      });
  };

  const handleOpenQRCodeModal = () => {
    setIsQRCodeModalOpen(!isQRCodeModalOpen);
  };

  return (
    <div className="flex items-center">
      <QRCodeModal
        open={isQRCodeModalOpen}
        toggle={handleOpenQRCodeModal}
        code={room?.inviteCode ? convertInviteCodeToUrl(room.inviteCode) : ""}
      />
      <Input
        className="h-10 w-28 md:w-auto rounded-l rounded-r-none cursor-pointer bg-[#342f3d6e] hover:bg-[#342f3da1] border border-r-0 border-[#614397] font-normal"
        type="text"
        onClick={handleCopyInviteCode}
        value={room?.inviteCode ?? "No invite code"}
        readOnly={true}
      />
      <Button
        onClick={handleOpenQRCodeModal}
        className="w-12 h-10 rounded-r-none rounded-l-none bg-[#342f3d6e] hover:bg-[#342f3da1] border border-[#614397] border-r-0"
        variant="secondary"
      >
        <span>
          <QrCodeIcon color="#ffffff" size="1.25rem" />
        </span>
      </Button>
      <Button
        onClick={handleCopyInviteCode}
        className="w-12 h-10 rounded-r rounded-l-none bg-[#342f3d6e] hover:bg-[#342f3da1] border border-[#614397]"
        variant="secondary"
      >
        <span>
          <UserPlusIcon color="#ffffff" size="1.25rem" />
        </span>
      </Button>
    </div>
  );
};

export default VideoRoomHeader;
