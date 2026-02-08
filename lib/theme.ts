import { defaultTheme } from "@coinbase/cds-web/themes/defaultTheme";

export const onebtcTheme = {
  ...defaultTheme,
  darkColor: {
    ...defaultTheme.darkColor,
    bg: "rgb(10,10,10)", // #0A0A0A
    bgSecondary: "rgb(17,17,17)", // #111111
    bgAlternate: "rgb(17,17,17)",
    bgElevation1: "rgb(17,17,17)",
    bgElevation2: "rgb(22,22,22)",
    fg: "rgb(245,240,232)", // #F5F0E8
    fgMuted: "rgb(102,102,102)", // #666666
    bgPositive: "rgb(247,147,26)", // #F7931A — Bitcoin orange
    fgPositive: "rgb(247,147,26)",
    bgLine: "rgba(26,26,26,1)", // #1A1A1A
    bgLineHeavy: "rgba(51,51,51,1)",
  },
} as const;

// CSS custom property equivalents for use outside CDS components
export const tokens = {
  colors: {
    bg: "#0A0A0A",
    bgCard: "#111111",
    text: "#F5F0E8",
    textMuted: "#666666",
    accent: "#F7931A",
    border: "#1A1A1A",
  },
} as const;
