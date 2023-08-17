import { SidebarViews } from "./RoomToolbar";

interface SidebarProps {
  activeView: SidebarViews;
  views: {
    [key in SidebarViews]: JSX.Element;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, views }) => {
  return (
    <div className="bg-[#0000006e] mt-2 md:mt-0 md:ml-2 shadow-md rounded overflow-y-hidden md:w-[18rem] min-w-[18rem] w-full h-full md:h-auto">
      <div className="flex flex-col max-h-[calc(100vh-157px)] h-full w-full">{views[activeView]}</div>
    </div>
  );
};

export default Sidebar;
