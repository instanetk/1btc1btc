import { VT323 } from "next/font/google";

// Swap the ticker font here — just change the import and constructor.
// Options: VT323, Silkscreen, Press_Start_2P, Pixelify_Sans, DotGothic16
export const tickerFont = VT323({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});
