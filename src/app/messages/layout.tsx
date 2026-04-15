import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { messagesUiEnabled } from "@/lib/feature-flags";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  if (!messagesUiEnabled) {
    redirect("/");
  }
  return <>{children}</>;
}
