import Image from "next/image";
import { NextPage } from "next";
import Link from "next/link";

const Error: NextPage = () => {
  return (
    <main className="flex flex-col h-full text-primary-foreground">
      <div className="w-full h-full flex flex-col items-center justify-center px-2 text-center">
        <h1 className="text-7xl font-bold mb-3">404</h1>
        <p className="mb-3">Um. You shouldn&apos;t be here 😅</p>
        <Image alt="" src={"/next-assets/images/tv-stand-by.gif"} width={400} height={300} loading="lazy" />
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

export default Error;
