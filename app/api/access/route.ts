import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const freeUsed = jar.get("free_used")?.value === "1";

  const pro = jar.get("pro")?.value === "1";
  const subId = jar.get("sub_id")?.value || "";

  let isProActive = false;

  // jei turim sub_id – patikrinam Stripe (kad PRO būtų tikras)
  if (pro && subId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      isProActive = sub.status === "active" || sub.status === "trialing";
    } catch {
      isProActive = false;
    }
  }

  const canGenerate = isProActive || !freeUsed;

  return NextResponse.json({
    isPro: isProActive,
    freeUsed,
    canGenerate,
  });
}
