import React from "react";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";

import { Page } from "@/components/Page";
import { Toaster } from "@/components/ui/toaster";
import { SocketProvider } from "@/context/SocketProvider";
import { useDarkMode } from "@/hooks/useDarkMode";

import "@/styles/global.css";

export default function App({ Component, pageProps }: AppProps) {
  useDarkMode();
  return (
    <>
      <SocketProvider sessionToken={pageProps?.sessionToken || null}>
        <Page>
          <Component {...pageProps} />
          <Analytics />
          <Toaster />
        </Page>
      </SocketProvider>
    </>
  );
}
