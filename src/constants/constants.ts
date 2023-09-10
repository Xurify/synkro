export const PRODUCTION_SITE_URL = "https://synkro.vercel.app";
export const BASE_URL = process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : "http://localhost:3000";

export const socketURL: string =
  process.env.NODE_ENV === "development" ? "ws://localhost:8000" : (process.env.NEXT_PUBLIC_SERVER_API as string);

export const YOUTUBE_VIDEO_URL_REGEX =
  /(youtu\.be\/|\/embed\/|\/watch\?v=|\/\?v=|\/v\/|\/e\/|watch\?v%3D|watch\?feature=player_embedded&v=)([^#\&\?]*).*/;

export const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;
