import Link from "next/link";
import VideoRoomHeader from "./VideoRoomHeader";
import { cn } from "@/libs/utils/frontend-utils";

export interface NavigationHeaderProps {
  page?: "home" | "video_room";
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({ page }) => {
  return (
    <nav className="bg-card w-full flex p-3 mb-4 shadow">
      <div className="flex justify-between w-full">
        <Link className="flex items-center" href="/">
          <div className="h-[2.5rem] w-[2.5rem] mr-2">
            <SynkroIcon />
          </div>
          <span className={cn("mt-[6px] font-normal text-xl text-foreground uppercase sm:block", { hidden: page === "video_room" })}>
            Synkro
          </span>
        </Link>
        {page === "video_room" && <VideoRoomHeader />}
      </div>
    </nav>
  );
};

export default NavigationHeader;

function SynkroIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 422 420">
      <path fill="#F583FF" d="M267.667 136H381V378H267.667z"></path>
      <path fill="#B1BEFF" d="M154.333 136h113.334v242H154.333V136z"></path>
      <path fill="#EEFEC1" d="M41 136H154.333V378H41z"></path>
      <path
        stroke="#3B4866"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="41.336"
        d="M401 117.252c0-1.02-.817-1.832-1.843-1.832H22.843A1.827 1.827 0 0021 117.252v279.597c0 1.02.817 1.832 1.843 1.832h376.314a1.827 1.827 0 001.843-1.832V117.252z"
        clipRule="evenodd"
      ></path>
      <path stroke="#3B4866" strokeLinecap="round" strokeLinejoin="round" strokeWidth="41.336" d="M306 21l-95 94.42L116 21"></path>
    </svg>
  );
}
