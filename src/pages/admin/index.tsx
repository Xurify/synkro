import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown01Icon, ArrowDown10Icon, ChevronRightIcon, HomeIcon, ServerIcon } from "lucide-react";

import { SERVER_URL } from "@/constants/constants";
import { Room, User } from "@/types/interfaces";
import { cn } from "@/libs/utils/frontend-utils";

import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";

import useAudio from "@/hooks/useAudio";

interface RoomsPageProps {}

export const RoomsPage: React.FC<RoomsPageProps> = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetch(`${SERVER_URL}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
        setRooms(Object.values(data.rooms));
      });
  }, []);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(Object.values(data.users));
      });
  }, []);

  const { play: playButtonClickSound } = useAudio({
    volume: 0.5,
    src: "/next-assets/audio/button_press.mp3",
  });

  const handleNavigateToRoom = (room: Room) => {
    router.push(`/invite/${room.inviteCode}`);
  };

  const handleToggleSort = () => {
    playButtonClickSound();
    setSort((currentSort) => (currentSort === "asc" ? "desc" : "asc"));
  };

  const sortedRooms: Room[] = rooms
    .filter((room) => !room.private)
    .sort((roomA, roomB) => {
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
          className="h-7 max-w-[200px] mx-2 ml-6 text-sm bg-[#070117] hover:border-input focus:border-input focus-visible:border-input"
          value="Users"
          readOnly={true}
        />
        <button className="ml-auto" onClick={handleToggleSort}>
          {sort === "asc" ? <ArrowDown01Icon color="#FFFFFF" size="1.25rem" /> : <ArrowDown10Icon color="#FFFFFF" size="1.25rem" />}
        </button>
      </div>
      <div className="bg-card w-full h-full max-w-[500px] mx-auto p-4 rounded-b">
        <div className="flex flex-col w-full h-[500px] gap-y-4 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-250px)] primary-scrollbar">
          {loading ? (
            <div className="w-full flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              {sortedRooms.length === 0 && <div className="text-white text-sm">There are currently no users at the moment</div>}
              {sortedRooms.length > 0 &&
                sortedRooms.map((room) => (
                  <div
                    className={cn(
                      "w-full flex flex-col gap-2 sm:flex-row justify-between items-center flex-wrap bg-[#6b2ed73d] hover:bg-[#6b2ed766] text-foreground border border-primary box-border cursor-pointer p-2 rounded transition duration-300 ease-in-out",
                      {
                        "[bg-[#170d20]": room.members.length === room.maxRoomSize,
                        "hover:bg-[#170d20]": room.members.length === room.maxRoomSize,
                      }
                    )}
                    key={room.id}
                  >
                    <div className="flex flex-1 w-full">
                      <h2>{room.name}</h2>
                      <div className="flex items-center ml-auto">
                        <span className="mr-2">
                          {room.members.length} / {room.maxRoomSize}
                        </span>
                        <span>
                          <ServerIcon color="#FFFFFF" size="1.25rem" />
                        </span>
                      </div>
                    </div>
                    <Button aria-label="Navigate to room" onClick={() => handleNavigateToRoom(room)} className="w-full sm:w-9 rounded-r">
                      <span>
                        <ChevronRightIcon color="#FFFFFF" size="1.25rem" />
                      </span>
                    </Button>
                  </div>
                ))}
            </>
          )}
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
    },
  };
};
