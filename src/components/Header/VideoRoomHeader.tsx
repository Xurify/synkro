import { UserPlusIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/SocketContext";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { BASE_URL } from "@/constants/constants";

export interface NavigationHeaderProps {
  page?: "home" | "video_room";
}

// background-color: #432b6d;
// border: 1px solid #614397;

// background-color: #5f566f6e;
//     border: 1px solid #614397;

const convertInviteCodeToUrl = (inviteCode: string) => `${BASE_URL}/invite/${inviteCode}`;

export const VideoRoomHeader: React.FC<NavigationHeaderProps> = ({}) => {
  const { room } = useSocket();
  const [_value, copy] = useCopyToClipboard();
  const { toast } = useToast();

  const handleCopyInviteCode = () => {
    room?.inviteCode &&
      copy(convertInviteCodeToUrl(room.inviteCode)).then(() => {
        toast({
          variant: "info",
          description: <span>Invite link copied!</span>,
        });
      });
  };

  return (
    <div className="flex items-center p-2">
      <Input
        className="h-10 rounded-l rounded-r-none cursor-pointer bg-[#342f3d6e] hover:bg-[#342f3da1] border border-r-0 border-[#614397] font-normal"
        type="text"
        onClick={handleCopyInviteCode}
        value={room?.inviteCode ?? ""}
        readOnly={true}
      />
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
