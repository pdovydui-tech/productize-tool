import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID!, // 👈 39€ price ID
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/success`,
    cancel_url: `${appUrl}/pay`,
  });

  return NextResponse.json({ url: session.url });
}
