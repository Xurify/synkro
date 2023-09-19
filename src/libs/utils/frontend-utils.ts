import {
  AUDIO_FILE_URL_REGEX,
  DAILYMOTION_URL_REGEX,
  SOUNDCLOUD_TRACK_SHORT_URL_REGEX,
  SOUNDCLOUD_TRACK_URL_REGEX,
  TWITCH_URL_REGEX,
  URL_REGEX,
  VIDEO_FILE_URL_REGEX,
  VIMEO_VIDEO_URL_REGEX,
  WISTIA_VIDEO_URL_REGEX,
  YOUTUBE_VIDEO_URL_REGEX,
} from "@/constants/constants";

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
  return match && match[3].length === 11 ? match[3] : null;
};

export const convertURLToSoundcloudTrackId = (url: string): string | null => {
  const match = url.match(SOUNDCLOUD_TRACK_SHORT_URL_REGEX) || url.match(SOUNDCLOUD_TRACK_URL_REGEX);
  return match?.[2] ? match[2] : null;
};

export const convertURLToVimeoVideoId = (url: string): string | null => {
  const match = url.match(VIMEO_VIDEO_URL_REGEX);
  return match?.[2] ? match[2] : null;
};

export const convertURLToWistiaVideoId = (url: string): string | null => {
  const match = url.match(WISTIA_VIDEO_URL_REGEX);
  return match?.[3] ? match[3] : null;
};

export const convertURLToDailyMotionVideoId = (url: string): string | null => {
  const match = url.match(DAILYMOTION_URL_REGEX);
  return match?.[1] ? match[1] : null;
};

export const convertURLToTwitchVideoId = (url: string): string | null => {
  const match = url.match(TWITCH_URL_REGEX);
  return match?.[1] ? match[1] : null;
};

export const convertURLToCorrectProviderVideoId = (url: string): string | null => {
  if (convertURLToYoutubeVideoId(url)) {
    return convertURLToYoutubeVideoId(url);
  } else if (convertURLToSoundcloudTrackId(url)) {
    return convertURLToSoundcloudTrackId(url);
  } else if (convertURLToVimeoVideoId(url)) {
    return convertURLToVimeoVideoId(url);
  } else if (convertURLToDailyMotionVideoId(url)) {
    return convertURLToDailyMotionVideoId(url);
  } else if (convertURLToTwitchVideoId(url)) {
    return convertURLToTwitchVideoId(url);
  }
  return null;
};

export const verifyURLIsAcceptedProvider = convertURLToCorrectProviderVideoId;

export const getMediaProviderFromVideoUrl = (
  url: string
): {
  name: "youtube" | "soundcloud" | "vimeo" | "wistia" | "dailymotion" | "twitch" | "mp4" | "mp3";
  url: string;
  id: string | null;
} | null => {
  if (convertURLToYoutubeVideoId(url)) {
    return {
      name: "youtube",
      url: `https://www.youtube.com/oembed?url=${encodeURI(url)}`,
      id: convertURLToYoutubeVideoId(url),
    };
  } else if (convertURLToSoundcloudTrackId(url)) {
    return {
      name: "soundcloud",
      url: `https://soundcloud.com/oembed?format=json&url=${encodeURI(url)}`,
      id: convertURLToSoundcloudTrackId(url),
    };
  } else if (convertURLToVimeoVideoId(url)) {
    return {
      name: "vimeo",
      url: `https://vimeo.com/api/oembed.json?url=${encodeURI(url)}`,
      id: convertURLToVimeoVideoId(url),
    };
  } else if (convertURLToWistiaVideoId(url)) {
    return {
      name: "wistia",
      url: `http://fast.wistia.com/oembed?url=${encodeURI(url)}`,
      id: convertURLToWistiaVideoId(url),
    };
  } else if (convertURLToDailyMotionVideoId(url)) {
    return {
      name: "dailymotion",
      url: `https://www.dailymotion.com/services/oembed?url=${encodeURI(url)}`,
      id: convertURLToDailyMotionVideoId(url),
    };
  } else if (convertURLToTwitchVideoId(url)) {
    return {
      name: "twitch",
      url: `https://iframe.ly/api/oembed?url=${encodeURI(url)}&api_key=2711e95040a356a5d79020`,
      id: convertURLToTwitchVideoId(url),
    };
  } else if (url.match(VIDEO_FILE_URL_REGEX)) {
    return {
      name: "mp4",
      url: `${encodeURI(url)}`,
      id: url,
    };
  } else if (url.match(AUDIO_FILE_URL_REGEX)) {
    // TODO: Not implemented yet
    return {
      name: "mp3",
      url: `${encodeURI(url)}`,
      id: url,
    };
  }
  return null;
};

//Facebook, Streamable, Twitch

export const isValidUrl = (url: string): string | null => {
  if (URL_REGEX.test(url)) return url;
  return null;
};

export const pickBetweenRandomString = (firstItem: string, secondItem: string) => (Math.random() > 0.5 ? firstItem : secondItem);
