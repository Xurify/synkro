export const YOUTUBE_VIDEO_URL_REGEX =
  /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/|\/embed\/.+$/;

export const socketURL: string =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : (process.env.REACT_APP_RAILWAY_API_URL as string);
