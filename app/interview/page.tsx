"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "./questions";

type Access = { isPro: boolean; freeUsed: boolean; canGenerate: boolean };

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function InterviewPage() {
  const router = useRouter();

  const [access, setAccess] = useState<Access | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/access", { cache: "no-store" });
        const raw = await res.text();
        const data = safeJsonParse(raw) as Access | null;

        // jei API blogai atsako — saugiai metame į pay
        if (!res.ok || !data) {
          setError(`Access check failed (HTTP ${res.status}).`);
          router.replace("/pay");
          return;
        }

        setAccess(data);

        // ✅ pagrindinė taisyklė: jei negali generuoti — net nerodom interview
        if (!data.canGenerate) {
          router.replace("/pay");
          return;
        }
      } catch (e: any) {
        setError(`Access check crashed: ${String(e?.message ?? e)}`);
        router.replace("/pay");
      } finally {
        setChecking(false);
      }
    }

    load();
  }, [router]);

  // Kol tikrinam — NIEKO nerodom (kad nematytų klausimų)
  if (checking) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Loading…</h1>
        <p style={{ opacity: 0.8 }}>Checking access…</p>
      </main>
    );
  }

  // Jei kažkas blogai — jau būsim redirectinę, bet paliekam fallback
  if (error) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Redirecting…</h1>
        <p style={{ opacity: 0.8 }}>{error}</p>
        <Link href="/pay">Go to Pay</Link>
      </main>
    );
  }

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const value = answers[q.key] ?? "";
  const canContinue = useMemo(() => value.trim().length > 0, [value]);
  const isLast = step === total - 1;
  const progress = Math.round(((step + 1) / total) * 100);

  function setValue(v: string) {
    setAnswers((prev) => ({ ...prev, [q.key]: v }));
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function next() {
    if (!canContinue) return;
    if (step < total - 1) setStep(step + 1);
  }

  async function generate() {
    if (!canContinue) return;

    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    // jei serveris sako PAYWALL — iškart į pay
    if (resp.status === 402) {
      router.push("/pay");
      return;
    }

    const raw = await resp.text();
    const data = safeJsonParse(raw);

    if (!resp.ok || !data) {
      alert(`Generate failed:\nHTTP ${resp.status}\n\n${raw || "(empty)"}`);
      return;
    }

    sessionStorage.setItem("generation", JSON.stringify(data));
    router.push("/result");
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Interview</h1>
        <div style={{ opacity: 0.85 }}>
          Plan: <b>{access?.isPro ? "Pro" : "Free"}</b>
        </div>
      </div>

      <div style={{ height: 8, background: "#eee", borderRadius: 6, marginTop: 12, overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: 8, background: "#111" }} />
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 18, marginBottom: 10 }}>{q.label}</div>

        {q.type === "text" ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 12, fontSize: 16 }}
            placeholder="Type your answer..."
          />
        ) : (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ width: "100%", padding: 12, fontSize: 16 }}
          >
            <option value="">Select…</option>
            {q.options!.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={back} disabled={step === 0} style={{ padding: "10px 14px" }}>
          Back
        </button>

        {!isLast ? (
          <button onClick={next} disabled={!canContinue} style={{ padding: "10px 14px" }}>
            Next
          </button>
        ) : (
          <button onClick={generate} disabled={!canContinue} style={{ padding: "10px 14px" }}>
            Generate
          </button>
        )}

        <Link href="/" style={{ marginLeft: "auto" }}>
          <button style={{ padding: "10px 14px" }}>Home</button>
        </Link>
      </div>
    </main>
  );
}
