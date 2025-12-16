"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "./questions";

type Access = { isPro: boolean; freeUsed: boolean; canGenerate: boolean };

export default function InterviewPage() {
  const router = useRouter();

  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // ---- LOAD ACCESS (and redirect if cannot generate) ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setFatal(null);

        const res = await fetch("/api/access", { cache: "no-store" });

        // jei API nulūžo / grąžino HTML, nebandome json()
        const text = await res.text();
        let a: Access | null = null;

        try {
          a = JSON.parse(text) as Access;
        } catch {
          throw new Error("API /api/access returned non-JSON:\n" + text.slice(0, 200));
        }

        if (cancelled) return;

        setAccess(a);

        if (!a.canGenerate) {
          router.replace("/pay");
          return;
        }
      } catch (e: any) {
        if (cancelled) return;
        setFatal(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ---- QUESTIONS SAFE GUARDS ----
  const total = QUESTIONS?.length ?? 0;

  // jei netyčia step išeina už ribų, pataisom
  useEffect(() => {
    if (total <= 0) return;
    if (step < 0) setStep(0);
    if (step > total - 1) setStep(total - 1);
  }, [step, total]);

  if (loading) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Loading…</h1>
        <p style={{ opacity: 0.8 }}>Checking access…</p>
      </main>
    );
  }

  if (fatal) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Interview crashed</h1>
        <p style={{ opacity: 0.85 }}>
          Error:
          <pre style={{ whiteSpace: "pre-wrap", background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
            {fatal}
          </pre>
        </p>
        <Link href="/">
          <button style={{ padding: "10px 14px" }}>Back Home</button>
        </Link>
      </main>
    );
  }

  // jei nėra klausimų – parodom aiškią klaidą (vietoj white screen)
  if (!QUESTIONS || total === 0) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>No questions found</h1>
        <p style={{ opacity: 0.85 }}>File app/interview/questions.ts must export QUESTIONS array.</p>
        <Link href="/">
          <button style={{ padding: "10px 14px" }}>Home</button>
        </Link>
      </main>
    );
  }

  const q = QUESTIONS[step];
  if (!q) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Invalid step</h1>
        <p style={{ opacity: 0.85 }}>
          Step {step} is out of range (0..{total - 1}).
        </p>
        <button onClick={() => setStep(0)} style={{ padding: "10px 14px" }}>
          Reset
        </button>
      </main>
    );
  }

  const value = answers[q.key] ?? "";
  const canContinue = useMemo(() => value.trim().length > 0, [value]);
  const isLast = step === total - 1;
  const progress = Math.round(((step + 1) / total) * 100);

  function setValue(v: string) {
    setAnswers((prev) => ({ ...prev, [q.key]: v }));
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function next() {
    if (!canContinue) return;
    if (step < total - 1) setStep((s) => s + 1);
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

    const text = await resp.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      alert("Generate failed (non-JSON):\n" + text.slice(0, 300));
      return;
    }

    if (!resp.ok) {
      alert("Generate failed:\n" + JSON.stringify(data, null, 2));
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
            {(q.options ?? []).map((o) => (
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
