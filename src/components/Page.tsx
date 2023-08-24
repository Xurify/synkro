import React from "react";
import PageHead from "./PageHead";
import NavigationHeader from "./NavigationHeader";
import StarField from "./StarField";

export const Page: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <NavigationHeader />
      <PageHead />
      <div className="px-2 h-[calc(100vh-88px)] md:h-full relative">{children}</div>
    </>
  );
};
