import { NextResponse } from "next/server";
import { detectLikelyPersonNames, requiresModerationQueue } from "@/lib/moderation";

type Payload = {
  reviewText?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const text = body.reviewText ?? "";
  const names = detectLikelyPersonNames(text);

  return NextResponse.json({
    requiresModeration: requiresModerationQueue(text),
    detectedNames: names,
  });
}
