"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const router = useRouter();
  const [msg, setMsg] = useState("Processing payment...");

  useEffect(() => {
    async function run() {
      const session_id = searchParams?.session_id;
      if (!session_id) {
        setMsg("Missing session_id ❌");
        return;
      }

      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id }),
      });

      if (!res.ok) {
        const t = await res.text();
        setMsg("Error adding credits ❌\n" + t);
        return;
      }

      setMsg("Payment successful ✅ Credits added! Redirecting…");

      setTimeout(() => {
        router.replace("/interview");
      }, 2000);
    }

    run();
  }, [router, searchParams]);

  return (
    <main style={{ maxWidth: 600, margin: "80px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Success</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{msg}</pre>
    </main>
  );
}
