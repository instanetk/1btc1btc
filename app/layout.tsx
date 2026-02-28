import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "@coinbase/onchainkit/styles.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://1btc1btc.money"
  ),
  title: "1BTC1BTC.money",
  description:
    "What does 1 BTC = 1 BTC mean? The simplest idea in Bitcoin — and the deepest. Generate reflections, mint them onchain.",
  openGraph: {
    title: "1BTC1BTC.money",
    description:
      "What does 1 BTC = 1 BTC mean? The simplest idea in Bitcoin — and the deepest. Generate reflections, mint them onchain.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "1BTC1BTC.money",
    description:
      "What does 1 BTC = 1 BTC mean? The simplest idea in Bitcoin — and the deepest. Generate reflections, mint them onchain.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_HOST && (
          <Script
            defer
            data-domain="1btc1btc.money"
            src={`${process.env.NEXT_PUBLIC_PLAUSIBLE_HOST}/js/script.js`}
            strategy="afterInteractive"
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
