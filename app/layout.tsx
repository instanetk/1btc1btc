import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { tickerFont } from "@/lib/fonts";
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
      <body className={`${inter.variable} ${tickerFont.variable}`}>
        {process.env.NEXT_PUBLIC_MATOMO_URL && (
          <Script id="matomo" strategy="afterInteractive">{`
            var _paq = window._paq = window._paq || [];
            _paq.push(["setDoNotTrack", true]);
            _paq.push(["disableCookies"]);
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="${process.env.NEXT_PUBLIC_MATOMO_URL}";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '3']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}</Script>
        )}
        {children}
      </body>
    </html>
  );
}
