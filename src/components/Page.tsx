import React from "react";
import PageHead from "./PageHead";
import NavigationHeader, { NavigationHeaderProps } from "./Header/NavigationHeader";

interface PageProps {
  navigationHeaderProps: NavigationHeaderProps;
}

export const Page: React.FC<React.PropsWithChildren<PageProps>> = ({ children, navigationHeaderProps = {} }) => {
  return (
    <>
      <NavigationHeader {...navigationHeaderProps} />
      <PageHead />
      <div className="md:px-2 h-[calc(100vh-106px)] md:h-full relative">{children}</div>
    </>
  );
};
