"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const sessionId = params.get("session_id");

    if (!sessionId) {
      router.replace("/");
      return;
    }

    // čia vėliau galėsim pridėti /api/activate subscription
  }, [params, router]);

  return (
    <div style={{ padding: 40 }}>
      <h1>Payment successful 🎉</h1>
      <p>Your subscription is now active.</p>
    </div>
  );
}
