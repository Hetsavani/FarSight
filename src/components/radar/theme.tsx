import { createContext, useContext, useState, type ReactNode } from "react";

const ThemeContext = createContext({ theme: "dark", setTheme: (_theme: string) => {} });

export function RadarThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("dark");
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useRadarTheme() {
  return useContext(ThemeContext);
}
