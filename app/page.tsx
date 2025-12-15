import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 40, marginBottom: 12 }}>
        Turn your freelancing process into a sellable product
      </h1>

      <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 24 }}>
        Answer a few questions and get a ready-to-sell digital product:
        idea, outline, pricing and landing page copy.
      </p>

      <Link href="/interview">
        <button style={{ padding: "12px 20px", fontSize: 16, cursor: "pointer" }}>
          Start
        </button>
      </Link>
    </main>
  );
}
