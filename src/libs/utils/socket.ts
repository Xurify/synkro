import { UserId } from "@/types/interfaces";

export const runIfAuthorized = (host: UserId, userId: UserId, callback?: () => void) => {
  if (host === userId) {
    typeof callback === "function" && callback();
  }
};
