"use client";

export default function PayPage() {
  async function subscribe() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    window.location.href = data.url;
  }

  return (
    <main style={{ maxWidth: 640, margin: "80px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Go Pro</h1>
      <p style={{ opacity: 0.85 }}>
        You’ve used your free generation. Subscribe to unlock unlimited generations.
      </p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
        <div style={{ fontSize: 20 }}>
          <b>€39</b> / month
        </div>
        <div style={{ opacity: 0.8, marginTop: 6 }}>Unlimited generations</div>
      </div>

      <button
        onClick={subscribe}
        style={{ marginTop: 16, padding: 14, fontSize: 16, cursor: "pointer", width: "100%" }}
      >
        Subscribe
      </button>
    </main>
  );
}
