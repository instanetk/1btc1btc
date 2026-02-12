"use client";
import { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { CHAIN } from "@/lib/constants";
import { ThemeProvider } from "@coinbase/cds-web";
import { MediaQueryProvider } from "@coinbase/cds-web/system";
import { onebtcTheme } from "@/lib/theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MediaQueryProvider>
      <ThemeProvider theme={onebtcTheme} activeColorScheme="dark">
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={CHAIN}
          config={{
            appearance: {
              mode: "dark",
            },
            wallet: {
              display: "modal",
              preference: "all",
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </ThemeProvider>
    </MediaQueryProvider>
  );
}
