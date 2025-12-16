import Stripe from "stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.redirect(new URL("/pay?err=missing_session", url.origin));
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const ok =
      session.mode === "subscription" &&
      (session.payment_status === "paid" || session.status === "complete");

    if (!ok) {
      return NextResponse.redirect(new URL("/pay?err=not_paid", url.origin));
    }

    const res = NextResponse.redirect(new URL("/result?activated=1", url.origin));

    res.cookies.set("pro", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "activate_failed" }, { status: 500 });
  }
}
