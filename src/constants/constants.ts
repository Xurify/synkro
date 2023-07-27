export const PRODUCTION_SITE_URL = "https://synkro.vercel.app/api";
export const BASE_URL = process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : "http://localhost:3000/api";

export const YOUTUBE_VIDEO_URL_REGEX = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/|\/embed\/.+$/;

export const socketURL: string =
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : (process.env.REACT_APP_RAILWAY_API_URL as string);
