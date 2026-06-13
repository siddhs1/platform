import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

// next/font calls are statically analyzed at build time: the argument MUST
// be an object literal of literal values (no spread, no shared variable).
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--f-display",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--f-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--f-mono",
});

export const fontVars = `${display.variable} ${body.variable} ${mono.variable}`;
