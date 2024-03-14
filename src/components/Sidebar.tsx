import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import {
  ButtonActions,
  SidebarViewButtons,
  SidebarViews,
} from "./VideoRoom/RoomToolbar";

interface SidebarProps {
  activeView: SidebarViews;
  deviceType: "desktop" | "mobile";
  onClickPlayerButton: (
    newActiveButton: ButtonActions,
    payload?: { videoUrl: string; videoIndex?: number }
  ) => void;
  views: {
    [key in SidebarViews]: JSX.Element;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  deviceType,
  views,
  onClickPlayerButton,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleDrawer = () => setIsOpen(currentValue => !currentValue);

  if (deviceType === "mobile") {
    const drawerContainerClassName = 'flex flex-col fixed bottom-0 left-0 right-0 z-40 w-full h-[calc(100vh-100px)] p-4 overflow-y-auto transition-transform bg-white dark:bg-card';
    return (
      <div
        id="drawer"
        className={`${drawerContainerClassName} ${isOpen ? 'translate-y-2' : 'translate-y-[90%]'}`}
        tabIndex={-1}
        aria-labelledby="drawer-label"
      >
        <div className="flex justify-between items-center px-2 mb-4">
          <h5
            id="drawer-label"
            className="inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400"
          >
            <svg
              className="w-4 h-4 me-2.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            {activeView.toUpperCase()}
          </h5>
          <button className="bg-gray-700/60 p-2 rounded" onClick={handleToggleDrawer}>
            <span>
              {isOpen ? <ChevronDownIcon color="#FFFFFF" size="1.25rem" /> : <ChevronUpIcon color="#FFFFFF" size="1.25rem" />}
            </span>
            <span className="sr-only">Close drawer</span>
          </button>
        </div>
        <div className="flex flex-col flex-1 w-full">{views[activeView]}</div>
        <div className="w-full bg-card shadow-md p-2 rounded flex justify-between gap-2 overflow-x-auto">
          <SidebarViewButtons
            activeView={activeView}
            className={"w-11 h-11 flex-1"}
            onClick={onClickPlayerButton}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-[#0000009c] md:dark:bg-[#0000006e] mt-2 md:mt-0 md:ml-2 shadow-md rounded overflow-y-hidden md:w-[18rem] min-w-[18rem] w-full h-full md:h-auto flex">
      <div className="flex flex-col flex-1 md:min-h-[calc(100vh-158px)] md:max-h-[calc(100vh-145px)] w-full">
        {views[activeView]}
      </div>
    </div>
  );
};

export default Sidebar;
