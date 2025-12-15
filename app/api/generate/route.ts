import { NextResponse } from "next/server";

type Payload = { answers: Record<string, string> };

function getCookieNumber(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return 0;
  const m = cookieHeader.match(new RegExp(`${name}=(\\d+)`));
  return m ? Number(m[1]) : 0;
}

function hasCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return false;
  return new RegExp(`${name}=`).test(cookieHeader);
}

function buildPrompt(answers: Record<string, string>) {
  return `You are an expert in productizing freelancing services into sellable digital products.

Return STRICT JSON only (no markdown, no extra text).

Schema:
{
  "product_name": string,
  "one_liner": string,
  "target_buyer": string,
  "format": string,
  "price_range": string,
  "outline": string[],
  "landing_page": {
    "headline": string,
    "subheadline": string,
    "bullets": string[],
    "sections": { "title": string, "content": string }[],
    "faq": { "q": string, "a": string }[]
  },
  "quick_start_48h": string[]
}

Interview answers:
${JSON.stringify(answers, null, 2)}
`;
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  // Paywall: 1 free generation, then requires credits
  const cookieHeader = req.headers.get("cookie");
  const credits = getCookieNumber(cookieHeader, "credits");
  const freeUsed = hasCookie(cookieHeader, "free_used");

  if (credits <= 0 && freeUsed) {
    return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 402 });
  }

  const body = (await req.json()) as Payload;
  const answers = body.answers ?? {};

  const prompt = buildPrompt(answers);

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "Return strict JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: "OpenAI error", detail: text }, { status: 500 });
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Invalid JSON from model", raw: content }, { status: 500 });
  }

  const res = NextResponse.json(parsed);

  // Update cookies: spend a credit or mark free used
  if (credits > 0) {
    res.cookies.set("credits", String(credits - 1), { httpOnly: true, sameSite: "lax", path: "/" });
  } else {
    res.cookies.set("free_used", "1", { httpOnly: true, sameSite: "lax", path: "/" });
  }

  return res;
}
