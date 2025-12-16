import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  answers: Record<string, string>;
};

function buildPrompt(answers: Record<string, string>) {
  // Paprastas promptas MVP – vėliau patobulinsim į “tikrą parduodamą produktą”
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
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
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
        // mažiau rizikos, kad bus milžiniškas output
        max_output_tokens: 1200,
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      // Labai svarbu: grąžinam tikrą klaidą į UI ir į Vercel logus
      console.error("OpenAI error status:", r.status);
      console.error("OpenAI error body:", raw);

      return NextResponse.json(
        { error: "OpenAI request failed", status: r.status, detail: raw },
        { status: 500 }
      );
    }

    // Responses API kartais grąžina output_text; jei ne – ištraukiam iš JSON
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Bad JSON from OpenAI", detail: raw },
        { status: 500 }
      );
    }

    const outputText =
      data?.output_text ??
      data?.output?.[0]?.content?.[0]?.text ??
      "";

    if (!outputText) {
      return NextResponse.json(
        { error: "Empty model output", detail: data },
        { status: 500 }
      );
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
