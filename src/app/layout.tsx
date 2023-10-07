import React from "react";
import { Analytics } from "@vercel/analytics/react";

import { Toaster } from "@/components/ui/toaster";
import NavigationHeader from "@/components/Header/NavigationHeader";
import { SocketProvider } from "@/context/SocketProvider";
//import { useDarkMode } from "@/hooks/useDarkMode";

import "./global.css";

import { Noto_Sans, Nunito } from "next/font/google";
import { Metadata } from "next";
import { cookies } from "next/headers";

const notoSans = Noto_Sans({ weight: ["100", "200", "300", "400", "500", "600", "700"], subsets: ["latin"] });
const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://synkro.vercel.app"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },
  title: "Synkro - Watch Together",
  description: "Synkro - The app made for watching videos with friends!",
  openGraph: {
    title: "Synkro",
    description: "Synkro - Watch Together",
    images: ["/opengraph-image"],
    url: new URL("https://synkro.vercel.app"),
  },
  twitter: {
    title: "Synkro",
    description: "Synkro - Watch Together",
    card: "summary",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionToken = cookies().get("session_token")?.value || null;
  const adminToken = cookies().get("admin_token")?.value || null;

  return (
    <html lang="en" className={`${notoSans.className} ${nunito.className}`}>
      <body className="dark">
        <Analytics />
        <Toaster />
        <SocketProvider sessionToken={sessionToken} adminToken={adminToken}>
          <NavigationHeader />
          <div className="md:px-2 h-[calc(100vh-72px)] md:h-[calc(100vh-108px)] relative">{children}</div>
        </SocketProvider>
      </body>
    </html>
  );
}
