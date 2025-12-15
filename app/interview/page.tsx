"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "./questions";

type Balance = {
  credits: number;
  freeUsed: boolean;
  canGenerate: boolean;
};

export default function InterviewPage() {
  const router = useRouter();

  const [balance, setBalance] = useState<Balance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // ✅ Gate: if user has 0 credits AND already used free -> redirect to /pay
  useEffect(() => {
    async function loadBalance() {
      try {
        const res = await fetch("/api/balance", { method: "GET", cache: "no-store" });

        // Read as text first to avoid "Unexpected end of JSON input"
        const ct = res.headers.get("content-type") || "";
        const text = await res.text();

        if (!res.ok) {
          console.log("Balance error status:", res.status, text);
          setBalance({ credits: 0, freeUsed: true, canGenerate: false });
          router.replace("/pay");
          return;
        }

        if (!ct.includes("application/json") || !text) {
          console.log("Balance non-JSON response:", text);
          setBalance({ credits: 0, freeUsed: true, canGenerate: false });
          router.replace("/pay");
          return;
        }

        const data = JSON.parse(text) as Balance;
        setBalance(data);

        if (!data.canGenerate) {
          router.replace("/pay");
          return;
        }
      } catch (e) {
        console.log("Balance fetch exception:", e);
        setBalance({ credits: 0, freeUsed: true, canGenerate: false });
        router.replace("/pay");
      } finally {
        setLoadingBalance(false);
      }
    }

    loadBalance();
  }, [router]);

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

    // Paywall by status
    if (resp.status === 402) {
      router.push("/pay");
      return;
    }

    const contentType = resp.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await resp.json() : await resp.text();

    // Paywall by JSON error (fallback)
    if (typeof data === "object" && data?.error === "PAYMENT_REQUIRED") {
      router.push("/pay");
      return;
    }

    if (!resp.ok) {
      alert("Generate failed:\n" + (typeof data === "string" ? data : JSON.stringify(data)));
      return;
    }

    sessionStorage.setItem("generation", JSON.stringify(data));
    router.push("/result");
  }

  // Loading screen while checking balance
  if (loadingBalance) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Loading…</h1>
        <p style={{ opacity: 0.8 }}>Checking credits…</p>
      </main>
    );
  }

  // Safety fallback: if we can't generate, we already redirect to /pay
  if (balance && !balance.canGenerate) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Credits required</h1>
        <p style={{ opacity: 0.8 }}>Redirecting to payment…</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Interview</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ opacity: 0.85 }}>
            Credits: <b>{balance?.credits ?? 0}</b>
          </div>
          <div style={{ opacity: 0.7 }}>
            {step + 1}/{total} ({progress}%)
          </div>
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
