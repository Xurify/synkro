import type { NextApiRequest, NextApiResponse } from "next";

interface CacheEntry {
  buffer: Buffer;
  timestamp: number;
  etag: string;
  contentType: string;
}

const CACHE_DURATION = 3600 * 1000 * 24 * 300; // 300 days;
const audioCache: Record<string, CacheEntry> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const audioUrl = req.query.url as string;

  if (!audioUrl) {
    res.status(400).end("Audio URL is required");
    return;
  }

  try {
    const cachedAudio = audioCache[audioUrl];
    const ifNoneMatch = req.headers["if-none-match"];

    if (cachedAudio) {
      const isCacheValid = Date.now() - cachedAudio.timestamp < CACHE_DURATION;

      if (isCacheValid && ifNoneMatch === cachedAudio.etag) {
        res.status(304).end();
        return;
      }

      if (isCacheValid) {
        res.setHeader("ETag", cachedAudio.etag);
        res.setHeader(
          "Cache-Control",
          `public, max-age=${CACHE_DURATION}, stale-while-revalidate=86400`,
        );
        res.setHeader("Content-Type", cachedAudio.contentType);
        res.status(200).send(cachedAudio.buffer);
        return;
      }
    }

    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      res.status(404).end("Audio not found");
      return;
    }

    const contentType =
      audioResponse.headers.get("content-type") || "audio/mpeg";
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const etag = `"${Buffer.from(audioBuffer).toString("base64").slice(0, 27)}"`;

    audioCache[audioUrl] = {
      buffer: audioBuffer,
      timestamp: Date.now(),
      etag,
      contentType,
    };

    res.setHeader("ETag", etag);
    res.setHeader(
      "Cache-Control",
      `public, max-age=${CACHE_DURATION}, stale-while-revalidate=86400`,
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Vary", "Accept-Encoding");

    res.status(200).send(audioBuffer);
  } catch (error) {
    console.error("Error proxying audio:", error);
    res.status(500).end("Error fetching audio");
  }
}
