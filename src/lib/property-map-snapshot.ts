import { prisma } from "@/lib/prisma";

type Args = {
  propertyId: string;
  latitude: number | null;
  longitude: number | null;
  existingDataUrl?: string | null;
};

function mapboxToken(): string | null {
  const token =
    process.env.MAPBOX_GEOCODING_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
    "";
  return token.length > 0 ? token : null;
}

function staticSnapshotUrl(latitude: number, longitude: number, token: string): string {
  // 400x320 output gives a crisp desktop card while keeping payload reasonable.
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+db7837(${longitude},${latitude})/${longitude},${latitude},13.2/400x320@2x?access_token=${encodeURIComponent(token)}`;
}

/**
 * Returns a cached property map snapshot data URL if available.
 * If not cached and coordinates/token exist, fetches once from Mapbox and stores it.
 */
export async function getOrCreatePropertyMapSnapshot(
  args: Args,
): Promise<string | null> {
  if (args.existingDataUrl && args.existingDataUrl.length > 0) {
    return args.existingDataUrl;
  }
  if (args.latitude == null || args.longitude == null) return null;

  const token = mapboxToken();
  if (!token) return null;

  try {
    const response = await fetch(
      staticSnapshotUrl(args.latitude, args.longitude, token),
      { cache: "no-store" },
    );
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "image/png";
    const bytes = Buffer.from(await response.arrayBuffer());
    const dataUrl = `data:${contentType};base64,${bytes.toString("base64")}`;

    await prisma.property.update({
      where: { id: args.propertyId },
      data: { mapSnapshotDataUrl: dataUrl },
    });

    return dataUrl;
  } catch {
    return null;
  }
}

