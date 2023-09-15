import { ServerMessageType } from "@/types/interfaces";

export const isServerMessage = (messageType: ServerMessageType | "USER"): boolean => {
  return Object.values(ServerMessageType).includes(messageType as ServerMessageType);
};

export const isClientMessage = (messageType: string): boolean => {
  return messageType === "USER";
};

export const getMessageClassname = (type: ServerMessageType | "USER"): string | undefined => {
  const defaultMessageClassname = "bg-[#171923] border border-gray-600";

  switch (type) {
    case "USER":
      return `user-message ${defaultMessageClassname}`;
    case ServerMessageType.ALERT:
      return "border border-orange-600 bg-[#67340f]";
    case ServerMessageType.USER_JOINED:
      return "border border-blue-400 bg-[#224655]";
    case ServerMessageType.USER_RECONNECTED:
      return "border border-blue-500 bg-[#2b3b5d]";
    case ServerMessageType.USER_DISCONNECTED:
      return "border border-destructive bg-[#471b1b]";
    case ServerMessageType.ERROR:
      return "bg-red-500";
    default:
      return `${defaultMessageClassname}`;
  }
};
