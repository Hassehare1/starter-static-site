// api/quote.js  – Vercel Serverless Function (Node 18)
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  // Hjälpfunktion att svara enhetligt
  const ok = (content, author) =>
    res.status(200).json({ content, author });

  // 1) Försök Quotable
  try {
    const r1 = await fetch("https://api.quotable.io/random?maxLength=120", { cache: "no-store" });
    if (r1.ok) {
      const d1 = await r1.json();
      return ok(d1.content, d1.author || "Okänd");
    }
  } catch {}

  // 2) Fallback: Type.fit
  try {
    const r2 = await fetch("https://type.fit/api/quotes", { cache: "no-store" });
    if (r2.ok) {
      const list = await r2.json();
      const item = list[Math.floor(Math.random() * list.length)];
      return ok(item?.text || "Okänt citat", item?.author || "Okänd");
    }
  } catch {}

  // 3) Lokal nödfallback
  const lokala = [
    "All kod är provisorisk tills den fungerar.",
    "Små steg är snabbast i längden.",
    "Gör det enkelt först, optimera sen."
  ];
  const q = lokala[Math.floor(Math.random() * lokala.length)];
  return ok(q, "AI-kompisen");
}
