import React from "react";
import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "experimental-edge",
};

export const OGImageResponse = () => {
  return new ImageResponse(Icon, {
    width: 500,
    height: 500,
  });
};

const Icon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
    <defs>
      <linearGradient
        id="gradient-0"
        x1="12"
        x2="12"
        y1="7"
        y2="22"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="rgba(213, 188, 244, 1)"></stop>
        <stop offset="1" stopColor="rgba(159, 100, 230, 1)"></stop>
      </linearGradient>
    </defs>
    <path
      fill="#3B4866"
      d="M-0.501 -0.902H499.499V493.086H-0.501z"
      transform="matrix(1.002 0 0 1.01838 -.577 -1.629)"
    ></path>
    <path
      fill="url(#gradient-0)"
      stroke="#fff"
      strokeWidth="2"
      d="M22 7.152A.152.152 0 0021.848 7H2.152A.152.152 0 002 7.152v14.696c0 .084.068.152.152.152h19.696a.152.152 0 00.152-.152V7.152z"
      paintOrder="fill"
      transform="matrix(.76642 0 0 .77895 61.93 58.78) matrix(17.1805 0 0 16.9042 39.777 47.149)"
    ></path>
    <path
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      d="M17 2l-5 5-5-5"
      transform="matrix(.76642 0 0 .77895 61.93 58.78) matrix(17.1805 0 0 16.9042 39.777 47.149)"
    ></path>
  </svg>
);

export default OGImageResponse;
