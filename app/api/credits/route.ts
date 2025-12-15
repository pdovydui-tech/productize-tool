import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const jar = await cookies();

  const body = await req.json();
  const delta = Number(body.delta ?? 0);

  const current = Number(jar.get("credits")?.value ?? 0);
  const next = Math.max(0, current + delta);

  const res = NextResponse.json({ credits: next });
  res.cookies.set("credits", String(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
