// api/stock.js  – enkel pris-API via Stooq (gratis, dagliga data, ingen nyckel)
// Anrop:  /api/stock?ticker=nvda   (gemener eller versaler funkar)
// Returnerar: { ticker, lastDate, lastClose, series: [{date, close}, ...] }

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  try {
    const url = new URL(req.url, "http://x");
    const raw = (url.searchParams.get("ticker") || "NVDA").trim();
    const ticker = raw.toLowerCase();

    // Stooq CSV dagliga OHLC: https://stooq.com/q/d/l/?s=aapl&i=d
    const stooqUrl = `https://stooq.com/q/d/l/?s=${encodeURIComponent(ticker)}&i=d`;
    const r = await fetch(stooqUrl, { cache: "no-store" });
    if (!r.ok) throw new Error(`Stooq ${r.status}`);

    const csv = await r.text();
    // Förväntat format:
    // Date,Open,High,Low,Close,Volume
    // 2024-08-01,xxx,xxx,xxx,xxx,xxx
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2 || !/^Date,Open,High,Low,Close,Volume/i.test(lines[0])) {
      throw new Error("Unexpected CSV");
    }

    const series = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const date = cols[0];
      const close = parseFloat(cols[4]);
      if (isFinite(close)) series.push({ date, close });
    }
    if (!series.length) throw new Error("No data");

    // sortera säkerhetsmässigt (äldre → nyare)
    series.sort((a, b) => (a.date < b.date ? -1 : 1));

    const last = series[series.length - 1];
    res.status(200).json({
      ticker: ticker.toUpperCase(),
      lastDate: last.date,
      lastClose: last.close,
      // skicka max ~90 dagar för liten graf
      series: series.slice(-90),
      source: "stooq (daily, delayed)",
    });
  } catch (e) {
    res.status(502).json({ error: "could_not_fetch", detail: String(e) });
  }
};
