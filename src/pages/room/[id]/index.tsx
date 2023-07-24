import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import RoomToolbar, { ButtonActions } from "@/components/RoomToolbar";

import { io, type Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents, ServerMessage } from "@/types/socketCustomTypes";
import { useRouter, useSearchParams } from "next/navigation";
//import { socketURL } from "@/constants/constants";
import { LEAVE_ROOM, USER_MESSAGE, SERVER_MESSAGE, JOIN_ROOM, SEND_USER_MESSAGE } from "@/constants/socketActions";
import type ReactPlayerType from "react-player";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export default function RoomPage() {
  const [activeButton, setActiveButton] = useState<ButtonActions>("chat");
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ username: string; message: string; id: string; userId: string }[]>([]);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [chatMessage, setChatMessage] = useState<string>("TEST");
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<ReactPlayerType | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") as string;

  useEffect(() => {
    if (!socket) {
      void fetch("/api/socket");
      socket = io();

      socket.on("connect", () => {
        console.log("Connected");
      });

      socket.on(SERVER_MESSAGE, (newMessage) => {
        console.log("SERVER_MESSAGE", newMessage);
        setServerMessages((prevMessages) => [...prevMessages, newMessage]);
      });

      socket.on(USER_MESSAGE, (newMessage) => {
        setChatMessages((prevMessages) => [...prevMessages, newMessage]);
      });
    }
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  useEffect(() => {
    if (socket && roomId) {
      const username = "Tester";
      const roomName = "TestRoom";
      socket.emit(JOIN_ROOM, { roomId, roomName, username });
    }
  }, [roomId]);

  const onReady = (player: ReactPlayerType) => {
    //socket = io();
    setPlayer(player);

    console.log(player.getDuration());

    setLoading(false);
    //this.setState({ player: e.target, socket });
    //this.onSocketMethods(socket);
    //this.setState({ loading: false });
  };

  const handleLeaveRoom = (): void => {
    if (socket) {
      socket.emit(LEAVE_ROOM, roomId);
      void router.push("/");
    }
  };

  const handleClickPlayerButton = (buttonAction: ButtonActions) => {
    setActiveButton(buttonAction);

    switch (buttonAction) {
      case "play":
        setIsPlaying(true);
        return;
      case "pause":
        setIsPlaying(false);
        return;
      default:
        break;
    }
  };

  const handleSendMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    console.log("emitted", socket, roomId);
    console.log("TEST", serverMessages, loading, player);
    player && console.log(player.getCurrentTime());

    if (socket) {
      socket.emit(SEND_USER_MESSAGE, chatMessage, roomId);
    }
  };

  const handleChangeChatMessage = (e: React.ChangeEvent<HTMLInputElement>) => setChatMessage(e.target.value);

  return (
    <main className="flex flex-col items-center p-4">
      <div className="max-w-[80rem] w-full">
        <div className="player-wrapper mb-2">
          <ReactPlayer
            className="react-player"
            //url="https://stream.mux.com/01nkUiLRyVE82K7fM3UgMickgF01qIdZQhyZS7DHc1bVo.m3u8?redundant_streams=true"
            url="https://youtu.be/4yKsIdr_PNU"
            width="100%"
            height="100%"
            playing={isPlaying}
            onReady={onReady}
          />
        </div>
      </div>
      <div className="w-full flex items-center justify-center mb-2">
        <RoomToolbar activeButton={activeButton} onClickPlayerButton={handleClickPlayerButton} isPlaying={isPlaying} />
      </div>
      <button onClick={handleLeaveRoom}>Leave</button>
      <button onClick={handleSendMessage}>Send message</button>
      <input onChange={handleChangeChatMessage} value={chatMessage} type="text" />
      <div>
        {chatMessages.map((chatMessage) => (
          <div key={chatMessage.id}>{chatMessage.message}</div>
        ))}
      </div>
    </main>
  );
}
