import React from "react";
import posthog from "posthog-js";
import PageHead from "./PageHead";
import NavigationHeader, { NavigationHeaderProps } from "./Header/NavigationHeader";

interface PageProps {
  navigationHeaderProps: NavigationHeaderProps;
  sessionToken: string | null;
}

export const Page: React.FC<React.PropsWithChildren<PageProps>> = ({ children, navigationHeaderProps = {}, sessionToken }) => {
  React.useEffect(() => {
    if (["synkro.vercel.app"].includes(location.host)) {
      posthog.init("phc_71zr5IIT4JprMrihRHlVvN6RfYYmVvWcK3HCWooPGsi", {
        api_host: "https://app.posthog.com",
        loaded: function (posthog) {
          sessionToken && posthog.identify(sessionToken);
        },
        enable_recording_console_log: true,
        secure_cookie: true,
      });
    }
  }, []);

  return (
    <>
      <PageHead />
      <NavigationHeader {...navigationHeaderProps} />
      <div className="md:px-2 h-[calc(100vh-106px)] md:h-full relative">{children}</div>
    </>
  );
};
