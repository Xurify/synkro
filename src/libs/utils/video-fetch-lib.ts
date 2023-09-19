import { BASE_URL } from "@/constants/constants";
import { fetcher, getMediaProviderFromVideoUrl } from "./frontend-utils";

export interface MediaData {
  url: string;
  title: string;
  thumbnail: string;
  id: string;
}

export interface OEmbed {
  version: number;
  type: string;
  provider_name: string;
  provider_url: string;
  height: number;
  width: string;
  title: string;
  description: string;
  thumbnail_url: string;
  html: string;
  author_name: string;
  author_url: string;
}

export const fetchMediaData = async (url: string): Promise<MediaData | null> => {
  let newMedia: MediaData | null = null;

  const mediaProvider = getMediaProviderFromVideoUrl(url);
  if (!mediaProvider) return null;

  if (mediaProvider.name === "mp4") {
    await fetcher(`${BASE_URL}/api/video-proxy?url=${encodeURI(url)}`)
      .then((data: MediaData) => {
        if (data) {
          newMedia = data;
          return newMedia;
        }
      })
      .catch((error) => {
        console.error(`Error fetching ${mediaProvider.name} media details: `, error);
      });

    return newMedia;
  }

  await fetcher(mediaProvider.url)
    .then((data: OEmbed) => {
      newMedia = {
        url,
        title: data.title,
        thumbnail: data.thumbnail_url || "",
        id: mediaProvider.id as string,
      };

      if (mediaProvider.name === "youtube") {
        newMedia.thumbnail = `https://i.ytimg.com/vi/${mediaProvider.id}/maxresdefault.jpg`;
      }
    })
    .catch((error) => {
      console.error(`Error fetching ${mediaProvider.name} media details: `, error);
    });

  return newMedia;
};

// function fetchFacebookEmbed() {
//   const accessToken = "YOUR_FACEBOOK_ACCESS_TOKEN";
//   const facebookPostUrl = "https://www.facebook.com/FacebookPage/posts/POST_ID";
//   const oEmbedUrl = `https://graph.facebook.com/v11.0/oembed_page?url=${encodeURIComponent(facebookPostUrl)}&access_token=${accessToken}`;
// }
