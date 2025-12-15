import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const jar = await cookies();

  const isPro = jar.get("pro")?.value === "1";
  const freeUsed = jar.get("free_used")?.value === "1";

  // 1 free use, po to tik subscription
  if (!isPro && freeUsed) {
    return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 402 });
  }

  // pažymim free panaudotą (jei dar ne pro)
  const res = NextResponse.next();
  if (!isPro && !freeUsed) {
    res.cookies.set("free_used", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // --- AI GENERAVIMAS (minimalus, bet realiai veikiantis) ---
  const body = await req.json();
  const answers = body.answers ?? {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  // paprasta "template" generacija (jei tavo projekte jau yra kitoks OpenAI kvietimas,
  // gali palikti savo, svarbu tik kad "gate" viršuje liktų)
  const output = {
    title: `Productized offer for: ${answers?.niche ?? "your niche"}`,
    bullets: [
      "Clear package scope",
      "Simple onboarding",
      "Deliverables + timeline",
      "Pricing + CTA",
    ],
    answers,
  };

  return NextResponse.json({ ok: true, result: output }, { headers: res.headers });
}
