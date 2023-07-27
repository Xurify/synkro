import { useState } from "react";
import CreateRoomBox from "@/components/CreateRoomBox";
import JoinRoomBox from "@/components/JoinRoomBox";

export default function Home() {
  const [isJoin, setIsJoin] = useState(true);

  const handleToggle = () => setIsJoin(!isJoin);

  return (
    <main className="flex flex-col mt-4">
      <div className="w-full h-full flex flex-col items-center justify-center px-2">
        {isJoin ? <JoinRoomBox toggle={handleToggle} /> : <CreateRoomBox toggle={handleToggle} />}
      </div>
    </main>
  );
}
