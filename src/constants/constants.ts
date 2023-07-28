export const PRODUCTION_SITE_URL = "https://synkro.vercel.app/api";
export const BASE_URL = process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : "http://localhost:3000/api";

export const socketURL: string =
  process.env.NODE_ENV === "development" ? (process.env.NEXT_PUBLIC_SERVER_API as string) : (process.env.NEXT_PUBLIC_SERVER_API as string);
