"use client";

import { useState } from "react";
import CreateRoomBox from "@/components/CreateRoomBox";
import JoinRoomBox from "@/components/JoinRoomBox";

export default function HomePage() {
  const [isCreateBoxShown, setIsCreateBoxShown] = useState(true);

  const handleToggle = () => setIsCreateBoxShown(!isCreateBoxShown);

  return (
    <main className="flex flex-col">
      <div className="w-full h-full flex flex-col items-center justify-center px-2">
        {isCreateBoxShown ? <CreateRoomBox toggle={handleToggle} /> : <JoinRoomBox toggle={handleToggle} />}
      </div>
    </main>
  );
}
