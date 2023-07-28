import React from "react";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { Page } from "@/components/Page";
import { SocketProvider } from "@/context/SocketProvider";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <SocketProvider sessionToken={pageProps?.sessionToken || null}>
        <Page>
          <Component {...pageProps} />
          <Analytics />
        </Page>
      </SocketProvider>
    </>
  );
}
