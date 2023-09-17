import { URL_REGEX, YOUTUBE_VIDEO_URL_REGEX } from "@/constants/constants";

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  const match = url.match(YOUTUBE_VIDEO_URL_REGEX);
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

export const pickBetweenRandomString = (firstItem: string, secondItem: string) => (Math.random() > 0.5 ? firstItem : secondItem);
