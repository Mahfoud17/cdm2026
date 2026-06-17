// Fonction serverless Vercel — fait le pont entre le navigateur et football-data.org
// pour éviter le blocage CORS. Accessible depuis le navigateur via /api/matches

export default async function handler(req, res) {
  const API_KEY = process.env.VITE_FOOTBALL_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "Clé API football manquante côté serveur" });
  }

  try {
    const apiRes = await fetch(
      "https://api.football-data.org/v4/competitions/2000/matches",
      { headers: { "X-Auth-Token": API_KEY } }
    );

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return res.status(apiRes.status).json({ error: "Erreur API football-data.org", detail: text });
    }

    const data = await apiRes.json();

    // Autorise notre propre app à appeler cette fonction
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur", detail: String(e) });
  }
}
