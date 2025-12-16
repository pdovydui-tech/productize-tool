import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  answers: Record<string, string>;
};

function buildPrompt(answers: Record<string, string>) {
  const lines = Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`);
  return `
You are a senior product marketer.
Create a HIGH-VALUE, actionable, structured digital product draft based on the answers.
Return:
1) Title
2) 1-sentence promise
3) Table of contents (8-15 items)
4) The actual content as steps/checklists/templates (not generic)
5) A short “How to use this” section
Answers:
${lines.join("\n")}
`.trim();
}

export async function POST(req: Request) {
  try {
    const jar = await cookies();

    const isPro = jar.get("is_pro")?.value === "true";
    const freeUsed = jar.get("free_used")?.value === "true";

    // ✅ 1 free → tada tik Pro
    if (!isPro && freeUsed) {
      return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 402 });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json()) as Payload;
    const answers = body?.answers ?? {};
    const input = buildPrompt(answers);

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        input,
        max_output_tokens: 1200,
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      console.error("OpenAI error status:", r.status);
      console.error("OpenAI error body:", raw);
      return NextResponse.json(
        { error: "OpenAI request failed", status: r.status, detail: raw },
        { status: 500 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Bad JSON from OpenAI", detail: raw }, { status: 500 });
    }

    const outputText =
      data?.output_text ??
      data?.output?.[0]?.content?.[0]?.text ??
      "";

    if (!outputText) {
      return NextResponse.json({ error: "Empty model output", detail: data }, { status: 500 });
    }

    // ✅ po pirmo sėkmingo generavimo pažymim free_used=true (jei ne Pro)
    if (!isPro) {
      jar.set("free_used", "true", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return NextResponse.json({ ok: true, text: outputText }, { status: 200 });
  } catch (e: any) {
    console.error("Generate route crashed:", e);
    return NextResponse.json(
      { error: "Server crashed", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
