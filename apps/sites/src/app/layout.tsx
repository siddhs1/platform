import type { ReactNode } from "react";
import { fontVars } from "./fonts";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
