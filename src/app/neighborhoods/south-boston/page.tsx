import Link from "next/link";
import {
  AppPageShell,
  PageHeader,
  SurfacePanel,
} from "@/app/_components/app-page-shell";
import { getSouthBostonRentBands } from "@/lib/analytics";

export default async function SouthBostonPage() {
  const bands = await getSouthBostonRentBands();

  return (
    <AppPageShell gapClass="gap-6">
      <PageHeader
        eyebrow="Neighborhood overview"
        title="South Boston rent bands"
        description="Approximate monthly rent ranges by bedroom band for South Boston, based on approved reviews in this project (Boston addresses with ZIP codes 02127 and 02210)."
      />

      <SurfacePanel variant="subtle">
        {bands.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Not enough data in South Boston yet. As more reviews are added, you&apos;ll
            see typical rent bands here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bands.map((band) => (
              <div
                key={band.bedroomCount}
                className="rounded-xl border border-zinc-200/80 bg-muted-blue-tint/40 px-4 py-3 text-xs"
              >
                <p className="text-sm font-semibold text-muted-blue-hover">
                  {band.bedroomCount}
                </p>
                {typeof band.median === "number" ? (
                  <>
                    <p className="mt-1 text-zinc-700">
                      Median: ${band.median.toLocaleString()} / month
                    </p>
                    {typeof band.min === "number" && typeof band.max === "number" ? (
                      <p className="mt-0.5 text-zinc-500">
                        Typical range: ${band.min.toLocaleString()}–$
                        {band.max.toLocaleString()}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1 text-zinc-500">Not enough data yet.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </SurfacePanel>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/properties"
          className="rounded-full border border-zinc-200 bg-white px-5 py-3 font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40"
        >
          Browse reviewed addresses
        </Link>
        <Link
          href="/submit"
          className="rounded-full bg-muted-blue px-5 py-3 font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition hover:bg-muted-blue-hover"
        >
          Share a South Boston review
        </Link>
      </div>
    </AppPageShell>
  );
}
