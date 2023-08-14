import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useUpdateEffect } from "./useUpdateEffect";
import { useMediaQuery } from "./useMediaQuery";

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

interface UseDarkModeOutput {
  isDarkMode: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

export function useDarkMode(defaultValue?: boolean): UseDarkModeOutput {
  const isDarkOS = useMediaQuery(COLOR_SCHEME_QUERY);
  const [isDarkMode, setDarkMode] = useLocalStorage<boolean>("dark-mode", defaultValue ?? isDarkOS ?? false);

  useEffect(() => {
    document.body.className = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  useUpdateEffect(() => {
    setDarkMode(isDarkOS);
  }, [isDarkOS]);

  return {
    isDarkMode,
    toggle: () => setDarkMode((prev) => !prev),
    enable: () => setDarkMode(true),
    disable: () => setDarkMode(false),
  };
}
