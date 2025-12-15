import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();

  const credits = Number(jar.get("credits")?.value || 0);
  const freeUsed = jar.get("free_used")?.value === "1";

  const canGenerate = credits > 0 || !freeUsed;

  return NextResponse.json(
    { credits, freeUsed, canGenerate },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
