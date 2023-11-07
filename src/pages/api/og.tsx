import React from "react";
import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

export const OGImageResponse = () => {
  return new ImageResponse(Icon, {
    height: 500,
    width: 500,
  });
};

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="497" viewBox="0 0 499 497">
    <g>
      <path fill="#F583FF" d="M303.98 171.336h116.598V420.59H303.98zm0 0"></path>
      <path fill="#B1BEFF" d="M187.379 171.336H303.98V420.59H187.38zm0 0"></path>
      <path fill="#EEFEC1" d="M70.777 171.336H187.38V420.59H70.777zm0 0"></path>
      <path
        fill="none"
        stroke="#2e3850"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="149.91"
        d="M1555.098 535.308c0-3.7-2.96-6.644-6.678-6.644H183.578c-3.635 0-6.623 2.985-6.623 6.616v1014.03c0 3.7 2.96 6.643 6.678 6.643h1364.842c3.635 0 6.623-2.985 6.623-6.616v-.027zm0 0"
        transform="scale(.28368 .284)"
      ></path>
      <path
        fill="none"
        stroke="#2e3850"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="149.91"
        d="M1210.566 186.22L866.033 528.665 521.501 186.221"
        transform="scale(.28368 .284)"
      ></path>
    </g>
  </svg>
);

// ORIGINAL STROKE COLOR - #3B4866

export default OGImageResponse;
