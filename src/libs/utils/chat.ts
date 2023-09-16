import { ServerMessageType } from "@/types/interfaces";

export const isServerMessage = (messageType: ServerMessageType | "USER"): boolean => {
  return Object.values(ServerMessageType).includes(messageType as ServerMessageType);
};

export const isClientMessage = (messageType: string): boolean => {
  return messageType === "USER";
};

export const getMessageClassname = (type: ServerMessageType | "USER" | "ADMIN"): string | undefined => {
  const defaultMessageClassname = "bg-[#171923] border border-gray-600 text-primary-foreground";

  switch (type) {
    case "USER":
      return `user-message ${defaultMessageClassname}`;
    case "ADMIN":
      //`user-message border border-[#b54eff] bg-[#431961] text-primary-foreground text-[#ffec87]`;
      return "user-message admin border border-[#b54eff] bg-[#431961] text-primary-foreground";
    case ServerMessageType.ALERT:
      return "border border-orange-600 bg-[#67340f] text-primary-foreground";
    case ServerMessageType.USER_JOINED:
      return "border border-blue-400 bg-[#224655] text-primary-foreground";
    case ServerMessageType.USER_RECONNECTED:
      return "border border-blue-500 bg-[#2b3b5d] text-primary-foreground";
    case ServerMessageType.USER_DISCONNECTED:
      return "border border-destructive bg-[#471b1b] text-primary-foreground";
    case ServerMessageType.NEW_HOST:
      return "border border-[#eff50a] bg-[#f8e33f] text-black";
    case ServerMessageType.ERROR:
      return "bg-red-500 text-primary-foreground";
    default:
      return `${defaultMessageClassname}`;
  }
};

export const generateUserIcon = (member: string, host: string, isAdmin?: boolean): "👑" | "🔑" | null => {
  if (isAdmin) return "🔑";
  if (!member || !host) return null;
  return member === host ? "👑" : null;
};
