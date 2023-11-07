import React from "react";
import Head from "next/head";

export const PageHead: React.FC = () => {
  return (
    <Head>
      <title>Synkro - Watch Together</title>
      <meta name="description" content="Synkro - The app made for watching videos with friends!" key="desc" />
      <meta property="og:image" content="/api/og" />
      <meta property="og:title" content="Synkro" />
      <meta property="og:description" content="Synkro - Watch Together" />
      <meta property="og:url" content="https://synkro.vercel.app" />
      <meta property="twitter:image" content="/api/og" />
      <meta property="twitter:card" content="app" />
      <meta property="twitter:title" content="Synkro" />
      <meta property="twitter:description" content="Synkro - Watch Together" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Head>
  );
};

export default PageHead;
