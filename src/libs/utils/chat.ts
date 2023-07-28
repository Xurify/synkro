import { ServerMessageType } from "@/types/interfaces";

export const isServerMessage = (messageType: ServerMessageType | "USER"): boolean => {
  return Object.values(ServerMessageType).includes(messageType as ServerMessageType);
};

export const isClientMessage = (messageType: string): boolean => {
  return messageType === "USER";
};
