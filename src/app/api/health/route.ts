import { NextResponse } from "next/server";

/** Uptime / load-balancer ping - no auth, no DB (keeps checks cheap). */
export async function GET() {
  return NextResponse.json(
    { ok: true, service: "rent-review-boston" },
    { status: 200 },
  );
}
