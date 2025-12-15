"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ResultPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("generation");
    if (raw) setData(JSON.parse(raw));
  }, []);

  if (!data) {
    return (
      <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28 }}>No result yet</h1>
        <Link href="/interview">
          <button style={{ padding: "10px 14px" }}>Back to interview</button>
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 34, marginBottom: 6 }}>{data.product_name}</h1>
      <div style={{ opacity: 0.8, marginBottom: 18 }}>{data.one_liner}</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/interview">
          <button style={{ padding: "10px 14px" }}>Create another</button>
        </Link>
        <Link href="/pay">
          <button style={{ padding: "10px 14px" }}>Go Pro (€39/mo)</button>
        </Link>
      </div>

      <hr style={{ margin: "22px 0" }} />

      <h2>Outline</h2>
      <ul>
        {(data.outline || []).map((x: string, i: number) => <li key={i}>{x}</li>)}
      </ul>
    </main>
  );
}
