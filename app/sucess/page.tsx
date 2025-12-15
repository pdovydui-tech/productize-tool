"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const params = useSearchParams();

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) {
      window.location.href = "/pay";
      return;
    }
    // suaktyvina pro cookie per server route ir nukreipia į interview
    window.location.href = `/api/activate?session_id=${encodeURIComponent(sessionId)}`;
  }, [params]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Activating subscription…</h1>
      <p>Please wait.</p>
    </main>
  );
}
