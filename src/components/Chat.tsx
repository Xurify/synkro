import React, { useEffect, useRef, useState } from "react";
import { Messages, ServerMessageType } from "@/types/interfaces";
import { USER_MESSAGE } from "@/constants/socketActions";
import { SocketContextType } from "@/context/SocketContext";
import { ArrowBigDown, SendIcon } from "lucide-react";

interface ChatProps {
  messages: Messages;
  socket: SocketContextType;
  roomId: string;
}

const Chat: React.FC<ChatProps> = ({ messages, socket, roomId }) => {
  const [chatMessage, setChatMessage] = useState<string>("");
  const [isNewMessagePopupShown, setIsNewMessagePopupShown] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement & { maxScrollTop?: number }>(null);

  const scrollToBottom = (force = false, smooth = true) => {
    const chatContainer = chatContainerRef.current;

    if (!chatContainer) return;

    const { scrollHeight, scrollTop, offsetHeight } = chatContainer;
    chatContainer.maxScrollTop = scrollHeight - offsetHeight;

    if (chatContainer.maxScrollTop - scrollTop <= offsetHeight || force) {
      if (smooth) {
        chatContainer.scrollTo({
          top: scrollHeight,
          left: 0,
          behavior: "smooth",
        });
      } else {
        chatContainer.scroll(0, scrollHeight);
      }
    } else setIsNewMessagePopupShown(true);
  };

  useEffect(() => scrollToBottom(true, false), []);

  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const { scrollHeight, offsetHeight, scrollTop } = chatContainer;

    if (scrollTop === scrollHeight - offsetHeight && isNewMessagePopupShown) {
      setIsNewMessagePopupShown(false);
    }
  }, [isNewMessagePopupShown]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const userScrolledToEnd = () => {
      const { scrollHeight, offsetHeight, scrollTop } = chatContainer;
      const containerHeight = scrollHeight - offsetHeight;

      if (containerHeight <= scrollTop && isNewMessagePopupShown) {
        setIsNewMessagePopupShown(false);
      }
    };

    chatContainer.addEventListener("scroll", userScrolledToEnd, false);

    return () => chatContainer.removeEventListener("scroll", userScrolledToEnd, false);
  }, [isNewMessagePopupShown]);

  const handleSeeNewMessages = () => {
    scrollToBottom(true);
    setIsNewMessagePopupShown(false);
  };

  const handleOnChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
    console.log("DASDADA");
  };
  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleSendMessage = () => {
    if (!socket || chatMessage.trim() === "") return;
    if (socket) {
      socket.emit(USER_MESSAGE, chatMessage, roomId);
    }
    setChatMessage("");
  };

  const getMessageClassname = (type: ServerMessageType | "USER"): string | undefined => {
    switch (type) {
    }

    return undefined;
  };

  return (
    <div className="flex flex-col flex-grow h-full relative hide-scrollbar">
      <div className="flex-grow overflow-y-auto p-4 h-full" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div className={getMessageClassname(message.type)} key={index}>
            {message.type === "USER" && (
              <h4 className={`${message.userId === socket?.userId ? "text-red-500" : "text-green-500"}`}>{message.username}</h4>
            )}
            <p className="text-text">{message.message}</p>
          </div>
        ))}
      </div>
      {isNewMessagePopupShown && (
        <div className="cursor-pointer absolute w-full bottom-[40.25px]" onClick={handleSeeNewMessages}>
          <NewMessage />
        </div>
      )}
      <div className="flex items-center">
        <input
          className="bg-gray-100 py-1.5 px-2 w-full outline-none h-10"
          type="text"
          value={chatMessage}
          onChange={handleOnChangeMessage}
          onKeyDown={handleOnKeyDown}
          placeholder="Say something"
        />
        <button onClick={handleSendMessage} className="bg-brand-indigo-300 w-12 h-10 flex items-center justify-center">
          <SendIcon color="#ffffff" size="1.25rem" />
        </button>
      </div>
    </div>
  );
};

const NewMessage = () => {
  return (
    <div className="group bg-indigo-700 hover:bg-indigo-600 text-center py-2 lg:px-4">
      <div
        className="p-1 bg-indigo-600 group-hover:bg-indigo-500 items-center text-indigo-100 leading-none lg:rounded-full flex lg:inline-flex w-full"
        role="alert"
      >
        <span className="flex rounded-full bg-indigo-400 uppercase px-2 text-xs font-bold mr-3">
          <ArrowBigDown fill="#FFFFFF" strokeOpacity={0} />
        </span>
        <span className="font-semibold mr-2 text-left flex-auto">New message!</span>
        <svg className="fill-current opacity-75 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z" />
        </svg>
      </div>
    </div>
  );
};

export default Chat;