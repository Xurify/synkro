import React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils/frontend-utils";

export interface EyeButtonProps {
  active?: boolean;
  className?: string;
  onClick: () => void;
}

export const EyeButton: React.FC<EyeButtonProps> = ({ className, onClick, active }) => {
  const handleClick = () => {
    //playButtonClickSound();
    onClick && onClick();
  };

  return (
    <Button
      aria-label="Toggle show password"
      className={cn("w-9 h-9 min-w-[2.25rem] text-primary hover:bg-primary hover:text-white ml-2", {
        [`${className}`]: !!className,
      })}
      onClick={handleClick}
      variant="secondary"
    >
      <span>{active ? <EyeOffIcon size="1.4rem" /> : <EyeIcon size="1.4rem" />}</span>
    </Button>
  );
};

export default EyeButton;
