import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQRCode } from "next-qrcode";

interface ModalProps {
  open: boolean;
  toggle: () => void;
  code: string;
}

export const QRCodeModal: React.FC<ModalProps> = ({ open, toggle, code }) => {
  const { Canvas } = useQRCode();

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]" onClose={toggle}>
        <DialogHeader>
          <DialogTitle className="text-secondary-foreground">QR Code</DialogTitle>
        </DialogHeader>
        <div className="w-full flex items-center justify-center h-[300px]">
          <Canvas
            text={code}
            options={{
              errorCorrectionLevel: "M",
              margin: 3,
              scale: 4,
              width: 200,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
