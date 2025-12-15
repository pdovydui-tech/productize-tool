import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

function getCookieNumber(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return 0;
  const m = cookieHeader.match(new RegExp(`${name}=(\\d+)`));
  return m ? Number(m[1]) : 0;
}

export async function POST(req: Request) {
  const { session_id } = await req.json();

  if (!session_id) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Not paid" }, { status: 402 });
  }

  const cookieHeader = req.headers.get("cookie");
  const currentCredits = getCookieNumber(cookieHeader, "credits");
  const nextCredits = currentCredits + 5;

  const res = NextResponse.json({ ok: true, credits: nextCredits });

  res.cookies.set("credits", String(nextCredits), { httpOnly: true, sameSite: "lax", path: "/" });

  // Optional: reset free_used after paying (so user doesn't get stuck)
  res.cookies.set("free_used", "1", { httpOnly: true, sameSite: "lax", path: "/" });

  return res;
}
