import React from "react";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";

import { Page } from "@/components/Page";
import { Toaster } from "@/components/ui/toaster";
import { SocketProvider } from "@/context/SocketProvider";
//import { useDarkMode } from "@/hooks/useDarkMode";

import "@/styles/global.css";

import { Inter, Rubik } from "next/font/google";

const rubik = Rubik({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"] });
const inter = Inter({ weight: ["100", "200", "300", "400", "500", "600", "700"], subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
  //useDarkMode();
  return (
    <>
      <SocketProvider sessionToken={pageProps?.sessionToken || null} adminToken={pageProps?.adminToken || null}>
        <div className={`${rubik.className} ${inter.className}`}>
          <Page navigationHeaderProps={pageProps.navigationHeaderProps}>
            <Component {...pageProps} />
            <Analytics />
            <Toaster />
          </Page>
        </div>
      </SocketProvider>
    </>
  );
}
