export const PRODUCTION_SITE_URL = "https://www.synkro.live";
export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? PRODUCTION_SITE_URL
    : "http://localhost:3000";

export const SOCKET_URL: string =
  process.env.NODE_ENV === "development"
    ? "ws://localhost:8000"
    : (process.env.NEXT_PUBLIC_SERVER_API as string);

export const SERVER_URL: string =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : `https://${process.env.NEXT_PUBLIC_SERVER_BASE_API}`;

export const YOUTUBE_VIDEO_URL_REGEX =
  /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/;
export const SOUNDCLOUD_TRACK_URL_REGEX =
  /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/;
export const SOUNDCLOUD_TRACK_SHORT_URL_REGEX =
  /^https?:\/\/(on.soundcloud\.com|snd\.sc)\/(.*)$/;
export const VIMEO_VIDEO_URL_REGEX = /^https?:\/\/(vimeo\.com)\/(.*)$/;
export const WISTIA_VIDEO_URL_REGEX =
  /https?:\/\/[^.]+\.(wistia\.net|wistia\.com|wi\.st)\/(medias|embed\/iframe)\/([a-zA-Z0-9]*)/;
export const DAILYMOTION_URL_REGEX =
  /https?:\/\/www\.dailymotion.com\/video\/([a-zA-Z0-9]*)/;
export const TWITCH_URL_REGEX = /https?:\/\/www\.twitch\.tv\/videos\/([0-9]*)/;

export const VIDEO_FILE_URL_REGEX =
  /((?:https?(?:%3A%2F%2F|:\/\/))(?:www\.)?(?:\S+)(?:%2F|\/)(?:(?!\.(?:mp4|mkv|wmv|m4v|mov|avi|flv|webm|flac|mka|m4a|aac|ogg))[^\/])*\.(mp4|mkv|wmv|m4v|mov|avi|flv|webm|flac|mka|m4a|aac|ogg))(?!\/|\.[a-z]{1,3})/;
export const AUDIO_FILE_URL_REGEX = /^https?:\/\/(.*)(\.mp3|.wav)/;
export const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;

//https:\/\/.*.mp4

export const BUTTON_PRESS_AUDIO =
  "https://utfs.io/f/0c5f10fd-9e8b-401a-94bb-032d7820bda4-lbqvhy.mp3";
export const USER_DISCONNECTED_AUDIO =
  "https://utfs.io/f/c77e24f4-9d3b-4a2d-98d9-6787d2280744-tmke27.mp3"; // Mixkit.co
export const USER_JOINED_AUDIO =
  "https://utfs.io/f/bc2ccdfa-a4d0-4b79-9b98-f41034efa2ab-6tmzer.mp3"; // Mixkit.co
export const USER_KICKED_AUDIO =
  "https://utfs.io/f/b3b7e3cc-3abe-4e97-a813-028a9f20bae6-ml9rpw.mp3"; // ElevenLabs
