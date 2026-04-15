import { NextResponse } from "next/server";
import { runPropertyGeocodeBackfill } from "@/lib/geocoding";

export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 8) return false;
  const auth = request.headers.get("authorization")?.trim();
  if (auth === `Bearer ${secret}`) return true;
  return (request.headers.get("x-cron-secret")?.trim() ?? "") === secret;
}

function parseLimit(request: Request): number {
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get("limit") ?? "50");
  if (!Number.isFinite(raw)) return 50;
  return Math.max(1, Math.min(200, Math.floor(raw)));
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const result = await runPropertyGeocodeBackfill(parseLimit(request));
  if (!result.ok) {
    return NextResponse.json(result, { status: 503 });
  }
  return NextResponse.json(result);
}
