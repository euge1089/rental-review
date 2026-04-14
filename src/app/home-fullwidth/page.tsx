import { redirect } from "next/navigation";

/** @deprecated Use `/` - full-width home is the default. */
export default function HomeFullwidthRedirect() {
  redirect("/");
}
