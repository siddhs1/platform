import type { ReactNode } from "react";
import "../globals.css";
import { requireSession } from "@/lib/auth";
import Shell from "@/components/Shell";

// Layout for the authenticated console surface. Owns the global stylesheet
// and the operator chrome (sidebar shell). Routes outside this group
// (sign-in, /preview) render without either.
export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  return <Shell session={session}>{children}</Shell>;
}
