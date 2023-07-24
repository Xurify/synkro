import React from "react";
import PageHead from "./PageHead";
import NavigationHeader from "./NavigationHeader";

export const Page: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <NavigationHeader />
      <PageHead />
      <div>{children}</div>
    </>
  );
};
