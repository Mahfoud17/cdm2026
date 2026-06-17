// Vercel Serverless Function — proxy vers football-data.org (évite CORS)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const FOOTBALL_KEY = process.env.VITE_FOOTBALL_API_KEY;
  if (!FOOTBALL_KEY) {
    return res.status(500).json({ error: "Clé API manquante" });
  }

  try {
    const apiRes = await fetch(
      "https://api.football-data.org/v4/competitions/2000/matches?status=FINISHED&season=2026",
      { headers: { "X-Auth-Token": FOOTBALL_KEY } }
    );
    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: "API error", status: apiRes.status });
    }
    const data = await apiRes.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
