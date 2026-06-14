/**
 * next/font wiring for the whole font catalog.
 *
 * Every family named in FONT_PAIRS (packages/blocks/src/tokens.ts) is
 * instantiated here as a self-hosted next/font face and exposed as a CSS
 * custom property `--f-<slug>`. The combined class string (`fontVars`) is
 * applied to <html> in layout.tsx, so every `--f-*` variable is defined
 * document-wide. A tenant's chosen pair then resolves
 * `--font-display` / `--font-body` to the right `--f-*` (see tokensToCssVars).
 *
 * preload: false is deliberate. This is a multi-tenant catalog: the active
 * pair is data-driven, so we don't know at build time which two families a
 * given page needs. With preload off, the @font-face rules all ship in CSS
 * but the browser only downloads the families actually referenced by
 * rendered text - i.e. the two in the active tenant's tokens, not all 15.
 * (display: "swap" + next/font's metric-matched fallback keep CLS/FOUT low.)
 *
 * NOTE: next/font calls must be object literals with literal values - no
 * spread, no shared variable, no computed args (the loader analyzes them
 * statically). So each call repeats subsets/display/preload verbatim.
 *
 * CONTRACT: the `--f-<slug>` variable names below MUST match the var(--f---)
 * references in FONT_PAIRS. Keep the two in sync when adding/removing a pair.
 * Variable fonts take no `weight`; the two static families (Spectral,
 * DM Serif Display) declare explicit weights.
 */
import {
  Archivo,
  Inter,
  Fraunces,
  Nunito_Sans,
  Playfair_Display,
  Source_Sans_3,
  Space_Grotesk,
  Lora,
  Work_Sans,
  Bricolage_Grotesque,
  Spectral,
  Manrope,
  Sora,
  DM_Serif_Display,
  DM_Sans,
  Hanken_Grotesk,
} from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-archivo" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-inter" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-fraunces" });
const nunito = Nunito_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-nunito" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-playfair" });
const source = Source_Sans_3({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-source" });
const space = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-space" });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-lora" });
const work = Work_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-work" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-bricolage" });
const spectral = Spectral({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "600", "700"], variable: "--f-spectral" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-manrope" });
const sora = Sora({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-sora" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--f-dmserif" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-dmsans" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-hanken" });

/** Space-separated className string defining all `--f-*` vars. Goes on <html>. */
export const fontVars = [
  archivo,
  inter,
  fraunces,
  nunito,
  playfair,
  source,
  space,
  lora,
  work,
  bricolage,
  spectral,
  manrope,
  sora,
  dmSerif,
  dmSans,
  hanken,
]
  .map((f) => f.variable)
  .join(" ");
