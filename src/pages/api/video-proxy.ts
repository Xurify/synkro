import { NextApiRequest, NextApiResponse } from "next";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const videoUrl = req.query.url as string;

  if (!videoUrl) {
    return res.status(400).json({ error: "url parameter is required." });
  }

  try {
    const videoResponse = await fetch(videoUrl, {
      method: "HEAD",
      mode: "no-cors",
      headers: {
        "Access-Control-Expose-Headers": "Content-Disposition",
      },
    });

    const contentDisposition = videoResponse.headers.get("Content-Disposition");

    const metadata = {
      url: videoUrl,
      title: contentDisposition?.split("filename=")?.[1]?.split(";")?.[0] ?? "Untitled",
      id: videoUrl,
      thumbnail: `https://synkro.vercel.app/next-assets/images/synkro_placeholder.svg`,
      "content-type": videoResponse.headers.get("content-type"),
    };
    return res.status(200).json(metadata);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch video." });
  }
};

export default handler;
