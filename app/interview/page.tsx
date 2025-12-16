"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "./questions";

type Access = { isPro: boolean; freeUsed: boolean; canGenerate: boolean };

export default function InterviewPage() {
  const router = useRouter();

  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/access", { cache: "no-store" });
        const a = (await res.json()) as Access;

        setAccess(a);

        // Jei neleidžiama generuoti (po free) — iškart į /pay
        if (!a.canGenerate) {
          router.replace("/pay");
          return;
        }
      } catch (e) {
        // jei /api/access nulūžta – irgi metame į pay (kad neliktų blank)
        router.replace("/pay");
        return;
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const value = q ? answers[q.key] ?? "" : "";
  const canContinue = value.trim().length > 0;
  const isLast = step === total - 1;
  const progress = Math.round(((step + 1) / total) * 100);

  function setValue(v: string) {
    if (!q) return;
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

    if (resp.status === 402) {
      router.push("/pay");
      return;
    }

    let data: any = null;
    try {
      data = await resp.json();
    } catch {
      data = { error: "Bad JSON from server" };
    }

    if (!resp.ok) {
      alert("Generate failed:\n" + JSON.stringify(data));
      return;
    }

    sessionStorage.setItem("generation", JSON.stringify(data));
    router.push("/result");
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Loading…</h1>
        <p style={{ opacity: 0.8 }}>Checking access…</p>
      </main>
    );
  }

  if (!q) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Interview</h1>
        <p style={{ opacity: 0.8 }}>No questions found.</p>
        <Link href="/"><button style={{ padding: "10px 14px" }}>Home</button></Link>
      </main>
    );
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
        <div style={{ fontSize: 18, marginBottom: 10 }}>
          {q.label}
        </div>

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
