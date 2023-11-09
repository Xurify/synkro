import React from "react";
import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";

interface ErrorPageProps {
  statusCode?: number;
  errorMessage?: string | null;
}

const Error: NextPage<ErrorPageProps> = ({ statusCode, errorMessage }) => {
  console.error(errorMessage);
  return (
    <main className="flex flex-col h-full text-primary-foreground">
      <div className="w-full h-full flex flex-col items-center justify-center px-2 text-center">
        <h1 className="text-7xl font-bold mb-3">{statusCode}</h1>
        <p className="mb-3">Um. You shouldn&apos;t be here 😅</p>
        <Image alt="" src={"/next-assets/images/tv-stand-by.webp"} width={400} height={300} priority={true} />
        {errorMessage && <span>{errorMessage}</span>}
        <Link
          className="max-w-[12rem] w-full h-10 mt-4 bg-primary hover:bg-primary/90 transition-colors rounded flex items-center justify-center"
          href="/"
        >
          <span>Back to Home</span>
        </Link>
      </div>
    </main>
  );
};

Error.getInitialProps = async ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, errorMessage: err?.message ?? null };
};

export default Error;
