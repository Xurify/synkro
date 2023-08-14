import { useState } from "react";
import CreateRoomBox from "@/components/CreateRoomBox";
import JoinRoomBox from "@/components/JoinRoomBox";
import { parse } from "cookie";
import { GetServerSideProps } from "next";

export const HomePage: React.FC = () => {
  const [isCreateBoxShown, setIsCreateBoxShown] = useState(true);

  const handleToggle = () => setIsCreateBoxShown(!isCreateBoxShown);

  return (
    <main className="flex flex-col">
      <div className="w-full h-full flex flex-col items-center justify-center px-2">
        {isCreateBoxShown ? <CreateRoomBox toggle={handleToggle} /> : <JoinRoomBox toggle={handleToggle} />}
      </div>
    </main>
  );
};

export default HomePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = parse(context.req.headers.cookie || "");
  const sessionToken = cookies["session_token"] || null;
  return {
    props: {
      sessionToken,
    },
  };
};
