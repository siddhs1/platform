import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { fontVars } from "./fonts";
import { getSession } from "@/lib/auth";
import { clerkEnabled } from "@/lib/clerk";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Platform · Operator Console",
  description: "Operator console for the multi-tenant site platform.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  const tree = (
    <html lang="en" className={fontVars}>
      <body>
        {session ? (
          <Shell session={session}>{children}</Shell>
        ) : (
          <div className="bare">{children}</div>
        )}
      </body>
    </html>
  );

  // Mount ClerkProvider only when Clerk is configured; otherwise the app
  // boots without any auth provider (dev-no-auth or unauthenticated).
  if (clerkEnabled) {
    return <ClerkProvider>{tree}</ClerkProvider>;
  }
  return tree;
}
