import { type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const videoUrl = searchParams.get("url") as string;

  if (!videoUrl) {
    return new Response("url parameter is required.", {
      status: 400,
      statusText: "url parameter is required.",
    });
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
      thumbnail: `/next-assets/images/synkro_placeholder.svg`,
      "content-type": videoResponse.headers.get("content-type"),
    };

    return new Response(JSON.stringify(metadata), {
      status: 200,
    });
  } catch (error) {
    return new Response("Failed to fetch video.", {
      status: 500,
      statusText: "Failed to fetch video.",
    });
  }
}
