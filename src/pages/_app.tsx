import React from "react";
import type { AppProps } from "next/app";
import { Inter, Rubik } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"

import { Page } from "@/components/Page";
import { Toaster } from "@/components/ui/toaster";
import { SocketProvider } from "@/context/SocketProvider";

import "@/styles/global.css";

const rubik = Rubik({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });
const inter = Inter({ weight: ["100", "200", "300", "400", "500", "600", "700"], subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <SocketProvider sessionToken={pageProps?.sessionToken || null} adminToken={pageProps?.adminToken || null}>
        <div className={`${rubik.className} ${inter.className} h-screen flex flex-col`}>
          <Page sessionToken={pageProps?.sessionToken || null} navigationHeaderProps={pageProps.navigationHeaderProps}>
            <Component {...pageProps} />
            <Analytics />
            <SpeedInsights />
            <Toaster />
          </Page>
        </div>
      </SocketProvider>
    </>
  );
}
