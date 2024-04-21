import { UserId } from "@/types/interfaces";

export const runIfAuthorized = (host: UserId, userId: UserId | undefined, callback?: () => void, isAdmin?: boolean, disableAdminCheck = false) => {
  if ((isAdmin && !disableAdminCheck) || host === userId) {
    typeof callback === "function" && callback();
  }
};
