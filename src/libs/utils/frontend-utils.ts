import { URL_REGEX, YOUTUBE_VIDEO_URL_REGEX } from "@/constants/constants";

export async function fetcher<JSON = any>(input: RequestInfo, init?: RequestInit): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const json = await res.json();
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number;
      };
      error.status = res.status;
      throw error;
    } else {
      throw new Error("An unexpected error occurred");
    }
  }

  return res.json();
}

export const capitalize = (value: string): string => {
  if (!value || typeof value !== "string") return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const truncate = (value: string, length: number): string => {
  if (!value || value.length <= length) return value;
  return `${value.slice(0, length)}...`;
};

export const convertURLToYoutubeVideoId = (url: string): string | null => {
  const regex = /(youtu\.be\/|\/embed\/|\/watch\?v=|\/\?v=|\/v\/|\/e\/|watch\?v%3D|watch\?feature=player_embedded&v=)([^#\&\?]*).*/;
  const match = url.match(regex);
  return match && match[2].length === 11 ? match[2] : null;
};

export const convertURLToCorrectProviderVideoId = (url: string): string | null => {
  if (YOUTUBE_VIDEO_URL_REGEX.test(url)) {
    return convertURLToYoutubeVideoId(url);
  }
  return "";
};

export const isValidUrl = (url: string): string | null => {
  if (URL_REGEX.test(url)) return url;
  return null;
};
