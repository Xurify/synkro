import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ModalProps {
  buttonText: React.ReactElement;
  headerText: React.ReactElement;
  disabled?: boolean;
}

export const UserModal: React.FC<ModalProps> = ({ buttonText, disabled = false, headerText }) => {
  return (
    <Dialog>
      <DialogTrigger asChild disabled={disabled}>
        <button className="text-primary-foreground text-left">{buttonText}</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-secondary-foreground">{headerText}</DialogTitle>
          <DialogDescription>Make changes to the room here. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="submit" variant="default">
            Make admin
          </Button>
        </DialogFooter>
        <DialogFooter>
          <Button type="submit" variant="destructive">
            Kick user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
