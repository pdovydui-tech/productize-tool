import Stripe from "stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.redirect(new URL("/pay", origin));
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : "";

  if (!subscriptionId) {
    return NextResponse.redirect(new URL("/pay", origin));
  }

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const active = sub.status === "active" || sub.status === "trialing";

  const res = NextResponse.redirect(new URL("/interview", origin));

  if (active) {
    // ✅ cookies dedam per NextResponse (be cookies() API)
    res.cookies.set("pro", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    res.cookies.set("sub_id", subscriptionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}
