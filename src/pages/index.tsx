import { useState } from "react";
import { GetServerSideProps } from "next";
import CreateRoomBox from "@/components/CreateRoomBox";
import JoinRoomBox from "@/components/JoinRoomBox";
import Link from "next/link";

export const HomePage: React.FC<{ sessionToken: string | null }> = () => {
  const [isCreateBoxShown, setIsCreateBoxShown] = useState(true);

  const handleToggle = () => setIsCreateBoxShown(!isCreateBoxShown);

  return (
    <main className="flex flex-col">
      <div className="w-full h-full flex flex-col items-center justify-center px-2">
        {isCreateBoxShown ? <CreateRoomBox toggle={handleToggle} /> : <JoinRoomBox toggle={handleToggle} />}
        <Link className="text-white uppercase text-sm mt-2" href="/rooms">
          Check out the Room Browser!
        </Link>
      </div>
    </main>
  );
};

export default HomePage;

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
