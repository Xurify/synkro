import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KICK_USER, SET_HOST } from "@/constants/socketActions";
import { useSocket } from "@/context/SocketContext";

interface ModalProps {
  buttonText: React.ReactElement;
  headerText: React.ReactElement;
  disabled?: boolean;
  userId: string;
  open: boolean;
  handleToggle: (userId: string | null) => void;
}

export const UserModal: React.FC<ModalProps> = ({ buttonText, disabled = false, headerText, userId, open, handleToggle }) => {
  const { socket } = useSocket();

  const handleChangeAdmin = () => {
    if (userId) {
      socket?.emit(SET_HOST, userId);
      handleToggle(null);
    }
  };

  const handleKickUser = () => {
    if (userId) {
      socket?.emit(KICK_USER, userId);
      handleToggle(null);
    }
  };

  const handleOpen = () => handleToggle(userId);
  const handleClose = () => handleToggle(null);

  return (
    <Dialog open={open}>
      <DialogTrigger onClick={handleOpen} asChild disabled={disabled}>
        <button className="text-primary-foreground text-left">{buttonText}</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" handleClose={handleClose}>
        <DialogHeader>
          <DialogTitle className="text-secondary-foreground">{headerText}</DialogTitle>
          <DialogDescription>Make changes to the room here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" variant="default" onClick={handleChangeAdmin}>
            Make admin
          </Button>
        </DialogFooter>
        <DialogFooter>
          <Button type="submit" variant="destructive" onClick={handleKickUser}>
            Kick user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
