import React from "react";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { Page } from "@/components/Page";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Page>
        <Component {...pageProps} />
        <Analytics />
      </Page>
    </>
  );
}
