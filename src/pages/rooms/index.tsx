import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { ArrowDown01Icon, ArrowDown10Icon, HomeIcon, ServerIcon } from "lucide-react";
import useSound from "use-sound";

import { cn } from "@/libs/utils/frontend-utils";
import { Room } from "@/types/interfaces";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/Spinner";
import { serverURL } from "@/constants/constants";

interface RoomsPageProps {
  rooms: Room[];
}

export const RoomsPage: React.FC<RoomsPageProps> = ({ rooms: initialRooms }) => {
  const [rooms, setRooms] = useState(initialRooms ?? []);
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [playButtonPressSound] = useSound("/next-assets/audio/button_press.mp3", { volume: 0.5 });

  useEffect(() => {
    const eventSource = new EventSource(`${serverURL}/api/public-rooms`);

    eventSource.onopen = () => {
      setLoading(false);
    };

    eventSource.onmessage = (event: { data: string }) => {
      const data = JSON.parse(event.data) as { type: "room"; rooms: Room[] };
      if (data.type) {
        const newRooms = data.rooms ?? [];
        setRooms(newRooms);
      }
    };

    eventSource.onerror = (event) => {
      eventSource.close();
      console.error("AN ERROR OCCURED:", event);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleToggleSort = () => {
    playButtonPressSound();
    setSort((currentSort) => (currentSort === "asc" ? "desc" : "asc"));
  };

  const sortedRooms: Room[] = rooms.sort((roomA, roomB) => {
    if (sort === "asc") {
      return roomA.members.length - roomB.members.length;
    } else {
      return roomB.members.length - roomA.members.length;
    }
  });

  return (
    <main className="flex flex-col text-center relative h-auto px-2 pb-4">
      <div className="flex items-center bg-[#141428] max-w-[500px] w-full mx-auto py-4 px-4 rounded-t">
        <div className="flex gap-x-1.5">
          <span className="block w-2.5 h-2.5 bg-[#f4645c] rounded-full"></span>
          <span className="block w-2.5 h-2.5 bg-[#f9be3e] rounded-full"></span>
          <span className="block w-2.5 h-2.5 bg-[#4ac645] rounded-full"></span>
        </div>
        <Input
          className="h-7 max-w-[200px] mx-2 ml-6 pb-2 text-sm bg-[#070117] hover:border-input focus:border-input focus-visible:border-input"
          value="Room Browser"
          readOnly={true}
        />
        <button className="ml-auto" onClick={handleToggleSort}>
          {sort === "asc" ? <ArrowDown01Icon color="#FFFFFF" size="1.25rem" /> : <ArrowDown10Icon color="#FFFFFF" size="1.25rem" />}
        </button>
      </div>
      <div className="bg-card w-full h-full max-w-[500px] mx-auto p-4 rounded-b">
        <div className="flex flex-col w-full h-[500px] gap-y-4 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-250px)] primary-scrollbar">
          {loading && (
            <div className="w-full flex items-center justify-center">
              <Spinner />
            </div>
          )}
          {!loading && sortedRooms.length === 0 && <div className="text-white text-sm">There are currently no public rooms available</div>}
          {!loading &&
            sortedRooms.map((room) => (
              <div
                className={cn(
                  "w-full flex justify-between flex-wrap bg-[#6b2ed73d] hover:bg-[#6b2ed766] text-foreground border border-primary box-border cursor-pointer p-2 rounded transition duration-300 ease-in-out",
                  {
                    "[bg-[#170d20]": room.members.length === room.maxRoomSize,
                    "hover:bg-[#170d20]": room.members.length === room.maxRoomSize,
                  }
                )}
                key={room.id}
              >
                <h2>{room.name}</h2>
                <div className="flex items-center">
                  <span className="mr-2">
                    {room.members.length} / {room.maxRoomSize}
                  </span>
                  <span>
                    <ServerIcon color="#FFFFFF" size="1.25rem" />
                  </span>
                </div>
              </div>
            ))}
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 w-full h-9 py-1 px-2 border uppercase mt-4"
          href="/"
        >
          Back Home
          <span className="ml-2">
            <HomeIcon color="#FFFFFF" size="1.25rem" />
          </span>
        </Link>
      </div>
    </main>
  );
};

export default RoomsPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const sessionToken = context.req.cookies["session_token"] || null;
  const adminToken = context.req.cookies["admin_token"] || null;
  return {
    props: {
      sessionToken,
      adminToken,
      rooms: [],
    },
  };
};