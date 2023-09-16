import { UserId } from "@/types/interfaces";

export const runIfAuthorized = (host: UserId, userId: UserId, isAdmin?: boolean, callback?: () => void) => {
  if (isAdmin || host === userId) {
    typeof callback === "function" && callback();
  }
};
