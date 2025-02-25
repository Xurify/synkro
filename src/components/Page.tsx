import React from "react";
import posthog from "posthog-js";
import PageHead from "./PageHead";
import NavigationHeader, {
  NavigationHeaderProps,
} from "./Header/NavigationHeader";

interface PageProps {
  navigationHeaderProps: NavigationHeaderProps;
  sessionToken: string | null;
}

const postHogKey: string = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";

export const Page: React.FC<React.PropsWithChildren<PageProps>> = ({
  children,
  navigationHeaderProps = {},
  sessionToken,
}) => {
  React.useEffect(() => {
    if (["www.synkro.live", "synkro.vercel.app"].includes(location.host)) {
      posthog.init(postHogKey, {
        api_host: `https://${location.host}/ingest`,
        ui_host: "https://us.posthog.com",
        loaded: function (posthog) {
          sessionToken && posthog.identify(sessionToken);
        },
        person_profiles: "always",
        enable_recording_console_log: true,
        secure_cookie: true,
        session_recording: {
          maskAllInputs: false,
          maskInputOptions: {
            password: true,
          },
        },
      });
    }
  }, []);

  return (
    <>
      <PageHead />
      <NavigationHeader {...navigationHeaderProps} />
      <div className="md:px-2 h-full md:h-[calc(100vh-64px)] relative md:pb-4">
        {children}
      </div>
    </>
  );
};
