import type { NextApiRequest, NextApiResponse } from "next";
import { fetcher } from "@/libs/utils/frontend-utils";
import { serverURL } from "@/constants/constants";

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const roomsResponse = await fetcher(`${serverURL}/api/rooms`);

    console.log("roomsResponse", roomsResponse);

    return res.status(200).json(roomsResponse);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch rooms." });
  }
};

export default handler;
