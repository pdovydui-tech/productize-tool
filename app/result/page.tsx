"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Generation = { ok: true; text: string };
type Access = { isPro: boolean; freeUsed: boolean; canGenerate: boolean };

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const router = useRouter();
  const [gen, setGen] = useState<Generation | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("generation");
    if (!raw) return;
    const data = safeJsonParse(raw);
    if (data?.text) setGen(data as Generation);
  }, []);

  async function createAnother() {
    const res = await fetch("/api/access", { cache: "no-store" });
    const raw = await res.text();
    const data = safeJsonParse(raw) as Access | null;

    if (!res.ok || !data) {
      alert("Access check failed:\nHTTP " + res.status + "\n\n" + (raw || "(empty)"));
      return;
    }

    if (!data.canGenerate) {
      router.push("/pay");
      return;
    }

    router.push("/interview");
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <button onClick={createAnother} style={{ padding: "10px 14px" }}>
          Create another
        </button>

        <Link href="/pay" style={{ textDecoration: "none" }}>
          Go Pro (€39/mo)
        </Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      {!gen ? (
        <p style={{ opacity: 0.8 }}>No result found. Generate first.</p>
      ) : (
        <pre style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{gen.text}</pre>
      )}
    </main>
  );
}
