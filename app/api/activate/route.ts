import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// extra export, kad TS 100% matytų modulį
export {};

export async function GET() {
  return NextResponse.json({ ok: true });
}
