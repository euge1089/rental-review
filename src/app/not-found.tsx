import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
} from "@/app/_components/app-page-shell";
import { linkInlineClass } from "@/lib/ui-classes";

export default function NotFound() {
  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="That URL doesn’t exist or may have moved."
      />
      <p className="text-sm text-zinc-600">
        Try the home page or browse reviewed addresses.
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className={linkInlineClass}>
          Home
        </Link>
        <Link href="/properties" className={linkInlineClass}>
          Browse properties
        </Link>
      </div>
    </AppPageShell>
  );
}
