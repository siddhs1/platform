import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { fontVars } from "./fonts";
import { clerkEnabled } from "@/lib/clerk";

export const metadata: Metadata = {
  title: "Platform · Operator Console",
  description: "Operator console for the multi-tenant site platform.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The root layout owns only <html>/<body>, font CSS variables, and (when
  // configured) the Clerk provider. Global stylesheet and operator chrome
  // live in the (app) route group, so /sign-in and /preview render without
  // the console's global CSS — keeping the live preview style-isolated and
  // matching the sites app (which ships no global stylesheet of its own).
  const tree = (
    <html lang="en" className={fontVars}>
      <body>{children}</body>
    </html>
  );

  if (clerkEnabled) {
    return <ClerkProvider>{tree}</ClerkProvider>;
  }
  return tree;
}
