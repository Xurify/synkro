import React from "react";
import { DicesIcon } from "lucide-react";
import useSound from "use-sound";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils/frontend-utils";

export interface DiceButtonProps {
  className?: string;
  onClick: () => void;
}

export const DiceButton: React.FC<DiceButtonProps> = ({ className, onClick }) => {
  const [playButtonPressSound] = useSound("/next-assets/audio/button_press.mp3", { volume: 0.5 });

  const handleOnClick = () => {
    playButtonPressSound();
    onClick && onClick();
  };

  return (
    <Button
      className={cn("w-9 h-9 min-w-[2.25rem] text-primary hover:bg-primary hover:text-white ml-2", { [`${className}`]: !!className })}
      onClick={handleOnClick}
      variant="secondary"
    >
      <span>
        <DicesIcon size="1.4rem" />
      </span>
    </Button>
  );
};

export default DiceButton;
