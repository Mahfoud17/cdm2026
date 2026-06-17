
// ─────────────────────────────────────────────────────────────────────────────
//  CDM 2026 PRONOSTICS — App.jsx
//  Remplacez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre .env
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────

const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FOOTBALL_KEY   = import.meta.env.VITE_FOOTBALL_API_KEY;
const supabase       = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CORRESPONDANCE noms API (anglais) → noms affichés ───────────────────────
const TEAM_MAP = {
  "Mexico":"Mexique","South Africa":"Afrique du Sud","Korea Republic":"Corée du Sud",
  "Czechia":"Tchéquie","Canada":"Canada","Bosnia and Herzegovina":"Bosnie-Herz.",
  "Qatar":"Qatar","Switzerland":"Suisse","Brazil":"Brésil","Morocco":"Maroc",
  "Haiti":"Haïti","Scotland":"Écosse","USA":"États-Unis","Paraguay":"Paraguay",
  "Australia":"Australie","Turkey":"Turquie","Germany":"Allemagne","Curaçao":"Curaçao",
  "Ivory Coast":"Côte d'Ivoire","Ecuador":"Équateur","Netherlands":"Pays-Bas",
  "Japan":"Japon","Senegal":"Sénégal","Venezuela":"Venezuela","Spain":"Espagne",
  "Belgium":"Belgique","Iran":"Iran","New Zealand":"Nouvelle-Zélande",
  "Portugal":"Portugal","Saudi Arabia":"Arabie Saoudite","Argentina":"Argentine",
  "Nigeria":"Nigéria","France":"France","Norway":"Norvège","Uruguay":"Uruguay",
  "Poland":"Pologne","Egypt":"Egypte","Serbia":"Serbie","Colombia":"Colombie",
  "Uzbekistan":"Ouzbékistan","England":"Angleterre","Croatia":"Croatie",
  "Ghana":"Ghana","Panama":"Panama",
};

// Synchronise automatiquement les résultats terminés depuis football-data.org
async function syncResultsFromAPI(matchesData) {
  if (!FOOTBALL_KEY) return;
  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/2000/matches?status=FINISHED",
      { headers: { "X-Auth-Token": FOOTBALL_KEY } }
    );
    if (!res.ok) return;
    const data = await res.json();
    for (const m of (data.matches || [])) {
      const homeFR = TEAM_MAP[m.homeTeam?.name];
      const awayFR = TEAM_MAP[m.awayTeam?.name];
      if (!homeFR || !awayFR) continue;
      const found = matchesData.find(x =>
        x.home.includes(homeFR) && x.away.includes(awayFR)
      );
      if (!found) continue;
      const hs = m.score?.fullTime?.home;
      const as_ = m.score?.fullTime?.away;
      if (hs === null || hs === undefined) continue;
      await supabase.from("results").upsert(
        { match_id: found.id, home_score: hs, away_score: as_ },
        { onConflict: "match_id" }
      );
    }
  } catch(e) { console.error("Erreur sync API:", e); }
}

// ─── MATCHES DATA ────────────────────────────────────────────────────────────

const MATCHES = [
  // ── GROUPE A : Mexique, Corée du Sud, Afrique du Sud, Tchéquie
  { id:1,  group:"Groupe A", home:"🇲🇽 Mexique",        away:"🇿🇦 Afrique du Sud",  date:"2026-06-11", time:"21:00", stage:"Groupes" },
  { id:2,  group:"Groupe A", home:"🇰🇷 Corée du Sud",   away:"🇨🇿 Tchéquie",        date:"2026-06-12", time:"04:00", stage:"Groupes" },
  { id:3,  group:"Groupe A", home:"🇨🇿 Tchéquie",       away:"🇿🇦 Afrique du Sud",  date:"2026-06-18", time:"18:00", stage:"Groupes" },
  { id:4,  group:"Groupe A", home:"🇲🇽 Mexique",        away:"🇰🇷 Corée du Sud",    date:"2026-06-19", time:"03:00", stage:"Groupes" },
  { id:5,  group:"Groupe A", home:"🇨🇿 Tchéquie",       away:"🇲🇽 Mexique",         date:"2026-06-25", time:"03:00", stage:"Groupes" },
  { id:6,  group:"Groupe A", home:"🇿🇦 Afrique du Sud", away:"🇰🇷 Corée du Sud",    date:"2026-06-25", time:"03:00", stage:"Groupes" },
  // ── GROUPE B : Canada, Qatar, Suisse, Bosnie-Herzégovine
  { id:7,  group:"Groupe B", home:"🇨🇦 Canada",         away:"🇧🇦 Bosnie-Herz.",    date:"2026-06-12", time:"21:00", stage:"Groupes" },
  { id:8,  group:"Groupe B", home:"🇶🇦 Qatar",          away:"🇨🇭 Suisse",          date:"2026-06-13", time:"21:00", stage:"Groupes" },
  { id:9,  group:"Groupe B", home:"🇨🇦 Canada",         away:"🇶🇦 Qatar",           date:"2026-06-19", time:"00:00", stage:"Groupes" },
  { id:10, group:"Groupe B", home:"🇧🇦 Bosnie-Herz.",   away:"🇨🇭 Suisse",          date:"2026-06-19", time:"21:00", stage:"Groupes" },
  { id:11, group:"Groupe B", home:"🇧🇦 Bosnie-Herz.",   away:"🇶🇦 Qatar",           date:"2026-06-25", time:"21:00", stage:"Groupes" },
  { id:12, group:"Groupe B", home:"🇨🇭 Suisse",         away:"🇨🇦 Canada",          date:"2026-06-25", time:"21:00", stage:"Groupes" },
  // ── GROUPE C : Brésil, Maroc, Haïti, Écosse
  { id:13, group:"Groupe C", home:"🇧🇷 Brésil",         away:"🇲🇦 Maroc",           date:"2026-06-13", time:"00:00", stage:"Groupes" },
  { id:14, group:"Groupe C", home:"🇭🇹 Haïti",          away:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse",         date:"2026-06-13", time:"03:00", stage:"Groupes" },
  { id:15, group:"Groupe C", home:"🇧🇷 Brésil",         away:"🇭🇹 Haïti",           date:"2026-06-19", time:"18:00", stage:"Groupes" },
  { id:16, group:"Groupe C", home:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse",        away:"🇲🇦 Maroc",           date:"2026-06-19", time:"21:00", stage:"Groupes" },
  { id:17, group:"Groupe C", home:"🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse",        away:"🇧🇷 Brésil",          date:"2026-06-25", time:"00:00", stage:"Groupes" },
  { id:18, group:"Groupe C", home:"🇲🇦 Maroc",          away:"🇭🇹 Haïti",           date:"2026-06-25", time:"00:00", stage:"Groupes" },
  // ── GROUPE D : États-Unis, Paraguay, Australie, Turquie
  { id:19, group:"Groupe D", home:"🇺🇸 États-Unis",     away:"🇵🇾 Paraguay",        date:"2026-06-13", time:"03:00", stage:"Groupes" },
  { id:20, group:"Groupe D", home:"🇦🇺 Australie",      away:"🇹🇷 Turquie",         date:"2026-06-13", time:"06:00", stage:"Groupes" },
  { id:21, group:"Groupe D", home:"🇺🇸 États-Unis",     away:"🇦🇺 Australie",       date:"2026-06-20", time:"00:00", stage:"Groupes" },
  { id:22, group:"Groupe D", home:"🇵🇾 Paraguay",       away:"🇹🇷 Turquie",         date:"2026-06-20", time:"03:00", stage:"Groupes" },
  { id:23, group:"Groupe D", home:"🇹🇷 Turquie",        away:"🇺🇸 États-Unis",      date:"2026-06-26", time:"00:00", stage:"Groupes" },
  { id:24, group:"Groupe D", home:"🇵🇾 Paraguay",       away:"🇦🇺 Australie",       date:"2026-06-26", time:"00:00", stage:"Groupes" },
  // ── GROUPE E : Allemagne, Côte d'Ivoire, Équateur, Curaçao
  { id:25, group:"Groupe E", home:"🇩🇪 Allemagne",      away:"🇨🇼 Curaçao",         date:"2026-06-14", time:"19:00", stage:"Groupes" },
  { id:26, group:"Groupe E", home:"🇨🇮 Côte d'Ivoire", away:"🇪🇨 Équateur",        date:"2026-06-14", time:"22:00", stage:"Groupes" },
  { id:27, group:"Groupe E", home:"🇩🇪 Allemagne",      away:"🇨🇮 Côte d'Ivoire",  date:"2026-06-20", time:"19:00", stage:"Groupes" },
  { id:28, group:"Groupe E", home:"🇪🇨 Équateur",       away:"🇨🇼 Curaçao",         date:"2026-06-20", time:"22:00", stage:"Groupes" },
  { id:29, group:"Groupe E", home:"🇨🇼 Curaçao",        away:"🇨🇮 Côte d'Ivoire",  date:"2026-06-26", time:"19:00", stage:"Groupes" },
  { id:30, group:"Groupe E", home:"🇪🇨 Équateur",       away:"🇩🇪 Allemagne",       date:"2026-06-26", time:"19:00", stage:"Groupes" },
  // ── GROUPE F : Pays-Bas, Japon, Sénégal, Venezuela
  { id:31, group:"Groupe F", home:"🇳🇱 Pays-Bas",       away:"🇯🇵 Japon",           date:"2026-06-14", time:"22:00", stage:"Groupes" },
  { id:32, group:"Groupe F", home:"🇸🇳 Sénégal",        away:"🇻🇪 Venezuela",       date:"2026-06-15", time:"01:00", stage:"Groupes" },
  { id:33, group:"Groupe F", home:"🇳🇱 Pays-Bas",       away:"🇸🇳 Sénégal",        date:"2026-06-21", time:"19:00", stage:"Groupes" },
  { id:34, group:"Groupe F", home:"🇯🇵 Japon",          away:"🇻🇪 Venezuela",       date:"2026-06-21", time:"22:00", stage:"Groupes" },
  { id:35, group:"Groupe F", home:"🇻🇪 Venezuela",      away:"🇳🇱 Pays-Bas",        date:"2026-06-27", time:"19:00", stage:"Groupes" },
  { id:36, group:"Groupe F", home:"🇯🇵 Japon",          away:"🇸🇳 Sénégal",        date:"2026-06-27", time:"19:00", stage:"Groupes" },
  // ── GROUPE G : Espagne, Belgique, Iran, Nouvelle-Zélande
  { id:37, group:"Groupe G", home:"🇪🇸 Espagne",        away:"🇳🇿 Nouvelle-Zélande",date:"2026-06-15", time:"19:00", stage:"Groupes" },
  { id:38, group:"Groupe G", home:"🇧🇪 Belgique",       away:"🇮🇷 Iran",            date:"2026-06-15", time:"22:00", stage:"Groupes" },
  { id:39, group:"Groupe G", home:"🇪🇸 Espagne",        away:"🇧🇪 Belgique",        date:"2026-06-21", time:"22:00", stage:"Groupes" },
  { id:40, group:"Groupe G", home:"🇮🇷 Iran",           away:"🇳🇿 Nouvelle-Zélande",date:"2026-06-22", time:"01:00", stage:"Groupes" },
  { id:41, group:"Groupe G", home:"🇧🇪 Belgique",       away:"🇳🇿 Nouvelle-Zélande",date:"2026-06-27", time:"22:00", stage:"Groupes" },
  { id:42, group:"Groupe G", home:"🇮🇷 Iran",           away:"🇪🇸 Espagne",         date:"2026-06-27", time:"22:00", stage:"Groupes" },
  // ── GROUPE H : Portugal, Argentine, Nigéria, Arabie Saoudite
  { id:43, group:"Groupe H", home:"🇵🇹 Portugal",       away:"🇸🇦 Arabie Saoudite", date:"2026-06-15", time:"22:00", stage:"Groupes" },
  { id:44, group:"Groupe H", home:"🇦🇷 Argentine",      away:"🇳🇬 Nigéria",         date:"2026-06-16", time:"01:00", stage:"Groupes" },
  { id:45, group:"Groupe H", home:"🇵🇹 Portugal",       away:"🇳🇬 Nigéria",         date:"2026-06-22", time:"22:00", stage:"Groupes" },
  { id:46, group:"Groupe H", home:"🇸🇦 Arabie Saoudite",away:"🇦🇷 Argentine",       date:"2026-06-23", time:"01:00", stage:"Groupes" },
  { id:47, group:"Groupe H", home:"🇳🇬 Nigéria",        away:"🇸🇦 Arabie Saoudite", date:"2026-06-28", time:"22:00", stage:"Groupes" },
  { id:48, group:"Groupe H", home:"🇦🇷 Argentine",      away:"🇵🇹 Portugal",        date:"2026-06-28", time:"22:00", stage:"Groupes" },
  // ── GROUPE I : France, Sénégal, Norvège, Barragiste
  { id:49, group:"Groupe I", home:"🇫🇷 France",         away:"🇸🇳 Sénégal",        date:"2026-06-16", time:"21:00", stage:"Groupes" },
  { id:50, group:"Groupe I", home:"🇳🇴 Norvège",        away:"🏳️ Barragiste",      date:"2026-06-16", time:"18:00", stage:"Groupes" },
  { id:51, group:"Groupe I", home:"🇫🇷 France",         away:"🏳️ Barragiste",      date:"2026-06-22", time:"23:00", stage:"Groupes" },
  { id:52, group:"Groupe I", home:"🇸🇳 Sénégal",        away:"🇳🇴 Norvège",        date:"2026-06-22", time:"20:00", stage:"Groupes" },
  { id:53, group:"Groupe I", home:"🏳️ Barragiste",     away:"🇸🇳 Sénégal",        date:"2026-06-28", time:"20:00", stage:"Groupes" },
  { id:54, group:"Groupe I", home:"🇳🇴 Norvège",        away:"🇫🇷 France",         date:"2026-06-28", time:"20:00", stage:"Groupes" },
  // ── GROUPE J : Uruguay, Pologne, Egypte, Serbie
  { id:55, group:"Groupe J", home:"🇺🇾 Uruguay",        away:"🇵🇱 Pologne",         date:"2026-06-16", time:"22:00", stage:"Groupes" },
  { id:56, group:"Groupe J", home:"🇪🇬 Egypte",         away:"🇷🇸 Serbie",          date:"2026-06-16", time:"19:00", stage:"Groupes" },
  { id:57, group:"Groupe J", home:"🇺🇾 Uruguay",        away:"🇪🇬 Egypte",          date:"2026-06-23", time:"22:00", stage:"Groupes" },
  { id:58, group:"Groupe J", home:"🇵🇱 Pologne",        away:"🇷🇸 Serbie",          date:"2026-06-23", time:"19:00", stage:"Groupes" },
  { id:59, group:"Groupe J", home:"🇷🇸 Serbie",         away:"🇺🇾 Uruguay",         date:"2026-06-29", time:"20:00", stage:"Groupes" },
  { id:60, group:"Groupe J", home:"🇵🇱 Pologne",        away:"🇪🇬 Egypte",          date:"2026-06-29", time:"20:00", stage:"Groupes" },
  // ── GROUPE K : Portugal… non, Colombie, Ouzbékistan, Portugal, Barragiste
  { id:61, group:"Groupe K", home:"🇨🇴 Colombie",       away:"🇺🇿 Ouzbékistan",    date:"2026-06-17", time:"22:00", stage:"Groupes" },
  { id:62, group:"Groupe K", home:"🇵🇹 Portugal... attend",away:"🏳️ Barragiste2", date:"2026-06-17", time:"19:00", stage:"Groupes" },
  { id:63, group:"Groupe K", home:"🇨🇴 Colombie",       away:"🏳️ Barragiste2",    date:"2026-06-23", time:"22:00", stage:"Groupes" },
  { id:64, group:"Groupe K", home:"🇺🇿 Ouzbékistan",    away:"🏳️ Barragiste2",    date:"2026-06-24", time:"01:00", stage:"Groupes" },
  { id:65, group:"Groupe K", home:"🏳️ Barragiste2",    away:"🇨🇴 Colombie",       date:"2026-06-29", time:"22:00", stage:"Groupes" },
  { id:66, group:"Groupe K", home:"🏳️ Barragiste2",    away:"🇺🇿 Ouzbékistan",    date:"2026-06-29", time:"22:00", stage:"Groupes" },
  // ── GROUPE L : Angleterre, Croatie, Ghana, Panama
  { id:67, group:"Groupe L", home:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",    away:"🇵🇦 Panama",         date:"2026-06-17", time:"22:00", stage:"Groupes" },
  { id:68, group:"Groupe L", home:"🇭🇷 Croatie",        away:"🇬🇭 Ghana",           date:"2026-06-18", time:"01:00", stage:"Groupes" },
  { id:69, group:"Groupe L", home:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",    away:"🇭🇷 Croatie",        date:"2026-06-24", time:"22:00", stage:"Groupes" },
  { id:70, group:"Groupe L", home:"🇵🇦 Panama",         away:"🇬🇭 Ghana",           date:"2026-06-24", time:"19:00", stage:"Groupes" },
  { id:71, group:"Groupe L", home:"🇬🇭 Ghana",          away:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",    date:"2026-06-30", time:"20:00", stage:"Groupes" },
  { id:72, group:"Groupe L", home:"🇵🇦 Panama",         away:"🇭🇷 Croatie",        date:"2026-06-30", time:"20:00", stage:"Groupes" },
  // ── PHASE FINALE — 32es de finale (28-30 juin 2026) — 16 matchs
  { id:81,  group:"Phase finale", home:"1er A", away:"2e B",        date:"2026-06-28", time:"18:00", stage:"32èmes" },
  { id:82,  group:"Phase finale", home:"1er C", away:"2e D",        date:"2026-06-28", time:"21:00", stage:"32èmes" },
  { id:83,  group:"Phase finale", home:"1er E", away:"2e F",        date:"2026-06-28", time:"00:00", stage:"32èmes" },
  { id:84,  group:"Phase finale", home:"1er B", away:"3e (1)",      date:"2026-06-29", time:"18:00", stage:"32èmes" },
  { id:85,  group:"Phase finale", home:"1er G", away:"3e (2)",      date:"2026-06-29", time:"21:00", stage:"32èmes" },
  { id:86,  group:"Phase finale", home:"1er I", away:"3e (3)",      date:"2026-06-29", time:"00:00", stage:"32èmes" },
  { id:87,  group:"Phase finale", home:"1er F", away:"2e E",        date:"2026-06-30", time:"18:00", stage:"32èmes" },
  { id:88,  group:"Phase finale", home:"1er K", away:"3e (4)",      date:"2026-06-30", time:"21:00", stage:"32èmes" },
  { id:89,  group:"Phase finale", home:"1er D", away:"3e (5)",      date:"2026-06-30", time:"00:00", stage:"32èmes" },
  { id:90,  group:"Phase finale", home:"1er L", away:"2e K",        date:"2026-07-01", time:"18:00", stage:"32èmes" },
  { id:91,  group:"Phase finale", home:"1er H", away:"3e (6)",      date:"2026-07-01", time:"21:00", stage:"32èmes" },
  { id:92,  group:"Phase finale", home:"2e I",  away:"2e J",        date:"2026-07-01", time:"00:00", stage:"32èmes" },
  { id:93,  group:"Phase finale", home:"1er J", away:"2e L",        date:"2026-07-02", time:"18:00", stage:"32èmes" },
  { id:94,  group:"Phase finale", home:"2e G",  away:"2e H",        date:"2026-07-02", time:"21:00", stage:"32èmes" },
  { id:95,  group:"Phase finale", home:"1er C... bis", away:"3e (7)",date:"2026-07-02", time:"00:00", stage:"32èmes" },
  { id:96,  group:"Phase finale", home:"2e A",  away:"2e C",        date:"2026-07-03", time:"18:00", stage:"32èmes" },
  // ── 16es de finale (7-11 juillet) — 8 matchs
  { id:101, group:"Phase finale", home:"V81", away:"V82", date:"2026-07-04", time:"18:00", stage:"16èmes" },
  { id:102, group:"Phase finale", home:"V83", away:"V84", date:"2026-07-04", time:"21:00", stage:"16èmes" },
  { id:103, group:"Phase finale", home:"V85", away:"V86", date:"2026-07-05", time:"18:00", stage:"16èmes" },
  { id:104, group:"Phase finale", home:"V87", away:"V88", date:"2026-07-05", time:"21:00", stage:"16èmes" },
  { id:105, group:"Phase finale", home:"V89", away:"V90", date:"2026-07-06", time:"18:00", stage:"16èmes" },
  { id:106, group:"Phase finale", home:"V91", away:"V92", date:"2026-07-06", time:"21:00", stage:"16èmes" },
  { id:107, group:"Phase finale", home:"V93", away:"V94", date:"2026-07-07", time:"18:00", stage:"16èmes" },
  { id:108, group:"Phase finale", home:"V95", away:"V96", date:"2026-07-07", time:"21:00", stage:"16èmes" },
  // ── Quarts (9-11 juillet) — 4 matchs
  { id:121, group:"Phase finale", home:"V101", away:"V102", date:"2026-07-09", time:"21:00", stage:"Quarts" },
  { id:122, group:"Phase finale", home:"V103", away:"V104", date:"2026-07-10", time:"21:00", stage:"Quarts" },
  { id:123, group:"Phase finale", home:"V105", away:"V106", date:"2026-07-11", time:"18:00", stage:"Quarts" },
  { id:124, group:"Phase finale", home:"V107", away:"V108", date:"2026-07-11", time:"21:00", stage:"Quarts" },
  // ── Demies (14-15 juillet) — 2 matchs
  { id:131, group:"Phase finale", home:"V121", away:"V122", date:"2026-07-14", time:"21:00", stage:"Demies" },
  { id:132, group:"Phase finale", home:"V123", away:"V124", date:"2026-07-15", time:"21:00", stage:"Demies" },
  // ── 3e place (18 juillet)
  { id:140, group:"Phase finale", home:"Perdant 131", away:"Perdant 132", date:"2026-07-18", time:"21:00", stage:"3e place" },
  // ── Finale (19 juillet)
  { id:141, group:"Phase finale", home:"V131", away:"V132", date:"2026-07-19", time:"21:00", stage:"Finale" },
];

const SCORING = { exact: 3, winner: 1 };

// ─── SCORING ─────────────────────────────────────────────────────────────────

function scoreForMatch(pred, result) {
  if (!pred || !result) return 0;
  const ph = parseInt(pred.home_score), pa = parseInt(pred.away_score);
  const rh = parseInt(result.home_score), ra = parseInt(result.away_score);
  if ([ph,pa,rh,ra].some(isNaN)) return 0;
  if (ph === rh && pa === ra) return SCORING.exact;
  const winner = s => s[0] > s[1] ? "H" : s[0] < s[1] ? "A" : "D";
  if (winner([ph,pa]) === winner([rh,ra])) return SCORING.winner;
  return 0;
}

function buildLeaderboard(users, predictions, results) {
  return users.map(u => {
    let total=0, exact=0, correct=0;
    const userPreds = predictions.filter(p => p.user_id === u.id);
    results.forEach(r => {
      const pred = userPreds.find(p => p.match_id === r.match_id);
      const pts = scoreForMatch(pred, r);
      total += pts;
      if (pts === SCORING.exact) exact++;
      if (pts > 0) correct++;
    });
    return { ...u, total, exact, correct, played: results.length };
  }).sort((a,b) => b.total - a.total || b.exact - a.exact);
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────

const COLORS = ["#059669","#DC2626","#2563EB","#9333EA","#EA580C","#0891B2","#BE185D","#0D9488"];
const getColor = id => COLORS[Math.abs(id % COLORS.length)];
const getInitials = name => name.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);

function Avatar({ user, size=36 }) {
  const color = getColor(user.id || 0);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:700, fontSize:size*0.38, color:"#fff", flexShrink:0 }}>
      {getInitials(user.username)}
    </div>
  );
}

// ─── SCORE INPUT ─────────────────────────────────────────────────────────────

function ScoreInput({ value, onChange, readOnly }) {
  return (
    <input type="number" min="0" max="20" value={value ?? ""}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      readOnly={readOnly}
      style={{ width:40, height:40, textAlign:"center", fontSize:18, fontWeight:800,
        background:"#0F172A", color:"#F8FAFC", border: readOnly?"1px solid #1E293B":"2px solid #334155",
        borderRadius:8, outline:"none", MozAppearance:"textfield" }}
    />
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────

function Badge({ pts }) {
  if (pts === 3) return <span style={{background:"#059669",color:"#fff",borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:700}}>🎯 +3</span>;
  if (pts === 1) return <span style={{background:"#2563EB",color:"#fff",borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:700}}>✓ +1</span>;
  return <span style={{color:"#475569",fontSize:11}}>0 pt</span>;
}

// ─── TOAST ───────────────────────────────────────────────────────────────────

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)",
      background:"#059669", color:"#fff", padding:"10px 20px", borderRadius:10,
      fontWeight:700, fontSize:13, zIndex:500, boxShadow:"0 4px 20px rgba(0,0,0,0.4)" }}>
      ✓ {msg}
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"#1E293B", borderRadius:"16px 16px 0 0", width:"100%",
        maxWidth:480, padding:22, paddingBottom:36 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h2 style={{ fontSize:16, fontWeight:800, margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"#334155", border:"none",
            color:"#94A3B8", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return <div style={{ padding:"12px 16px 4px", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.1em" }}>{children}</div>;
}

// ─── BUTTON STYLE ─────────────────────────────────────────────────────────────

const btn = (bg="#334155", color="#fff", full=false) => ({
  background:bg, color, border:"none", borderRadius:8, cursor:"pointer",
  padding: full ? "12px 20px" : "8px 16px", fontSize: full?14:12, fontWeight:700,
  letterSpacing:"-0.01em", width: full?"100%":undefined
});

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab,        setTab]        = useState("home");
  const [modal,      setModal]      = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cdm_user")); } catch { return null; }
  });
  const [users,       setUsers]       = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState("");

  const isAdmin = currentUser?.username?.toLowerCase() === "admin";

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  // ── Fetch all data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [u, p, r] = await Promise.all([
      supabase.from("users").select("*").order("created_at"),
      supabase.from("predictions").select("*"),
      supabase.from("results").select("*"),
    ]);
    if (u.data) setUsers(u.data);
    if (p.data) setPredictions(p.data);
    if (r.data) setResults(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Sync automatique résultats toutes les 5 minutes
  useEffect(() => {
    syncResultsFromAPI(MATCHES).then(fetchAll);
    const interval = setInterval(() => {
      syncResultsFromAPI(MATCHES).then(fetchAll);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Realtime
  useEffect(() => {
    const ch = supabase.channel("global")
      .on("postgres_changes", { event:"*", schema:"public" }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchAll]);

  // ── Register
  async function handleRegister(username, password) {
    username = username.trim();
    if (!username || !password) return;
    const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) { alert("Ce pseudo est déjà pris !"); return; }
    const { data, error } = await supabase.from("users")
      .insert({ username, password_hash: btoa(password) })
      .select().single();
    if (error) { alert("Erreur : " + error.message); return; }
    localStorage.setItem("cdm_user", JSON.stringify(data));
    setCurrentUser(data);
    setModal(null);
    setTab("pronostics");
    showToast("Bienvenue " + username + " !");
  }

  // ── Login
  async function handleLogin(username, password) {
    const { data } = await supabase.from("users")
      .select("*").eq("username", username.trim()).single();
    if (!data) { alert("Pseudo introuvable."); return; }
    if (data.password_hash !== btoa(password)) { alert("Mot de passe incorrect."); return; }
    localStorage.setItem("cdm_user", JSON.stringify(data));
    setCurrentUser(data);
    setModal(null);
    setTab("pronostics");
    showToast("Bonjour " + data.username + " !");
  }

  // ── Logout
  function handleLogout() {
    localStorage.removeItem("cdm_user");
    setCurrentUser(null);
    setTab("home");
  }

  // ── Save prediction
  async function handlePredict(matchId, homeScore, awayScore) {
    if (!currentUser) return;
    const existing = predictions.find(p => p.user_id===currentUser.id && p.match_id===matchId);
    if (existing) {
      await supabase.from("predictions")
        .update({ home_score: homeScore, away_score: awayScore })
        .eq("id", existing.id);
    } else {
      await supabase.from("predictions")
        .insert({ user_id: currentUser.id, match_id: matchId, home_score: homeScore, away_score: awayScore });
    }
    await fetchAll();
    showToast("Pronostic enregistré !");
  }

  // ── Save result (admin)
  async function handleResult(matchId, homeScore, awayScore) {
    const existing = results.find(r => r.match_id === matchId);
    if (existing) {
      await supabase.from("results")
        .update({ home_score: homeScore, away_score: awayScore })
        .eq("match_id", matchId);
    } else {
      await supabase.from("results")
        .insert({ match_id: matchId, home_score: homeScore, away_score: awayScore });
    }
    await fetchAll();
    showToast("Résultat enregistré !");
  }

  const leaderboard = buildLeaderboard(users, predictions, results);
  const resultsMap  = Object.fromEntries(results.map(r => [r.match_id, r]));
  const predsMap    = {};
  predictions.forEach(p => {
    if (!predsMap[p.user_id]) predsMap[p.user_id] = {};
    predsMap[p.user_id][p.match_id] = p;
  });

  const NAV = [
    { id:"home",       icon:"🏠", label:"Accueil"    },
    { id:"pronostics", icon:"⚽", label:"Pronostics" },
    { id:"classement", icon:"🏆", label:"Classement" },
    { id:"resultats",  icon:"📊", label:"Résultats"  },
  ];

  if (loading) return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#0F172A",
      color:"#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:40 }}>⚽</div>
      <div style={{ fontSize:14, color:"#64748B" }}>Chargement…</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", minHeight:"100vh", background:"#0F172A",
      color:"#F8FAFC", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto" }}>

      {/* Header */}
      <header style={{ background:"linear-gradient(135deg,#064E3B 0%,#065F46 60%,#047857 100%)",
        padding:"16px 20px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:22 }}>🌍</span>
              <span style={{ fontWeight:800, fontSize:17, letterSpacing:"-0.02em" }}>CDM 2026</span>
              <span style={{ background:"#F59E0B", color:"#000", fontSize:9, fontWeight:700,
                borderRadius:4, padding:"2px 6px", letterSpacing:"0.06em" }}>PRONOSTICS</span>
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:1 }}>USA · Canada · Mexique</div>
          </div>
          {currentUser ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Avatar user={currentUser} size={32}/>
              <span style={{ fontSize:12, fontWeight:600, maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentUser.username}</span>
            </div>
          ) : (
            <button onClick={()=>setModal("login")} style={btn("#F59E0B","#000")}>Connexion</button>
          )}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex:1, overflowY:"auto", paddingBottom:72 }}>
        {tab === "home" && (
          <HomeView
            currentUser={currentUser}
            stats={{ users: users.length, played: results.length, remaining: MATCHES.filter(m=>!resultsMap[m.id]).length }}
            onRegister={()=>setModal("register")}
            onLogin={()=>setModal("login")}
            onLogout={handleLogout}
            onGoProno={()=>setTab("pronostics")}
            isAdmin={isAdmin}
            onAdmin={()=>setModal("admin")}
          />
        )}
        {tab === "pronostics" && (
          <PronosticView
            matches={MATCHES}
            currentUser={currentUser}
            predsMap={predsMap}
            resultsMap={resultsMap}
            onPredict={handlePredict}
            onLoginRequired={()=>setModal("login")}
          />
        )}
        {tab === "classement" && (
          <LeaderboardView leaderboard={leaderboard} currentUser={currentUser} matchesPlayed={results.length} />
        )}
        {tab === "resultats" && (
          <ResultsView matches={MATCHES.filter(m=>resultsMap[m.id]).sort((a,b)=>(`${a.date} ${a.time}`).localeCompare(`${b.date} ${b.time}`))} resultsMap={resultsMap} users={users} predsMap={predsMap} />
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:480, background:"#1E293B",
        borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", zIndex:100 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={()=>setTab(n.id)} style={{
            flex:1, background:"none", border:"none", padding:"10px 4px 8px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            cursor:"pointer", color: tab===n.id ? "#10B981" : "#64748B" }}>
            <span style={{ fontSize:20 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontWeight: tab===n.id?700:400 }}>{n.label}</span>
          </button>
        ))}
      </nav>

      <Toast msg={toast} />

      {/* Modals */}
      {modal==="register" && <Modal title="Créer un compte" onClose={()=>setModal(null)}><AuthForm mode="register" onSubmit={handleRegister} onSwitch={()=>setModal("login")}/></Modal>}
      {modal==="login"    && <Modal title="Se connecter"    onClose={()=>setModal(null)}><AuthForm mode="login"    onSubmit={handleLogin}    onSwitch={()=>setModal("register")}/></Modal>}
      {modal==="admin" && isAdmin && <Modal title="🔧 Saisie des résultats" onClose={()=>setModal(null)}><AdminPanel matches={MATCHES} resultsMap={resultsMap} onResult={handleResult}/></Modal>}
    </div>
  );
}

// ─── HOME VIEW ────────────────────────────────────────────────────────────────

function HomeView({ currentUser, stats, onRegister, onLogin, onLogout, onGoProno, isAdmin, onAdmin }) {
  return (
    <div>
      <div style={{ background:"linear-gradient(180deg,#064E3B 0%,#0F172A 100%)", padding:"36px 20px 28px", textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:8 }}>🏆</div>
        <h1 style={{ fontSize:26, fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.03em" }}>Pronostics entre amis</h1>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:14, margin:"0 0 24px", lineHeight:1.6 }}>
          Inscrivez-vous, pronostifiez chaque match et suivez votre classement en temps réel !
        </p>
        {currentUser ? (
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={onGoProno} style={btn("#10B981","#fff",false)}>⚽ Mes pronostics</button>
            {isAdmin && <button onClick={onAdmin} style={btn("#F59E0B","#000")}>🔧 Admin</button>}
          </div>
        ) : (
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={onRegister} style={btn("#10B981","#fff")}>S'inscrire</button>
            <button onClick={onLogin} style={btn("#334155","#fff")}>Se connecter</button>
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, background:"#0F172A", margin:"16px 16px 0" }}>
        {[
          { v:stats.users,     l:"Joueurs",       i:"👥" },
          { v:stats.played,    l:"Matchs joués",  i:"✅" },
          { v:stats.remaining, l:"À venir",        i:"📅" },
        ].map((s,i) => (
          <div key={i} style={{ background:"#1E293B", padding:"16px 8px", textAlign:"center" }}>
            <div style={{ fontSize:20 }}>{s.i}</div>
            <div style={{ fontSize:22, fontWeight:800, color:"#10B981" }}>{s.v}</div>
            <div style={{ fontSize:11, color:"#64748B" }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ margin:"16px", background:"#1E293B", borderRadius:12, padding:16 }}>
        <h3 style={{ fontSize:12, fontWeight:700, margin:"0 0 12px", color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em" }}>Barème des points</h3>
        {[
          { pts:"3 pts", label:"Score exact prédit 🎯", color:"#059669" },
          { pts:"1 pt",  label:"Bon vainqueur (ou nul) ✓", color:"#2563EB" },
          { pts:"0 pt",  label:"Mauvais résultat ✗", color:"#DC2626" },
        ].map((r,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <span style={{ background:r.color, color:"#fff", borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700, minWidth:42, textAlign:"center" }}>{r.pts}</span>
            <span style={{ fontSize:13, color:"#CBD5E1" }}>{r.label}</span>
          </div>
        ))}
      </div>

      {currentUser && (
        <div style={{ margin:"0 16px 20px", textAlign:"center" }}>
          <button onClick={onLogout} style={{ background:"none", border:"1px solid #334155", color:"#94A3B8", borderRadius:8, padding:"8px 18px", fontSize:12, cursor:"pointer" }}>
            Se déconnecter ({currentUser.username})
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PRONOSTIC VIEW ──────────────────────────────────────────────────────────

function PronosticView({ matches, currentUser, predsMap, resultsMap, onPredict, onLoginRequired }) {
  const [filter, setFilter] = useState("all");
  const stages = ["all","Groupes","32èmes","16èmes","Quarts","Demies","3e place","Finale"];
  const labels  = { all:"Tous", Groupes:"Groupes", "32èmes":"32èmes", "16èmes":"16èmes", Quarts:"Quarts", Demies:"Demies", "3e place":"3e place", Finale:"Finale" };
  const filtered = filter==="all" ? matches : matches.filter(m=>m.stage===filter);
  const sortByDate = (a, b) => (`${a.date} ${a.time}`).localeCompare(`${b.date} ${b.time}`);
  const upcoming = filtered.filter(m=>!resultsMap[m.id]).sort(sortByDate);
  const done     = filtered.filter(m=> resultsMap[m.id]).sort(sortByDate);

  return (
    <div>
      <div style={{ display:"flex", gap:8, padding:"12px 16px", overflowX:"auto" }}>
        {stages.map(s => (
          <button key={s} onClick={()=>setFilter(s)} style={{
            background: filter===s ? "#10B981":"#1E293B", color: filter===s?"#fff":"#94A3B8",
            border:"none", borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:600,
            cursor:"pointer", whiteSpace:"nowrap" }}>{labels[s]}</button>
        ))}
      </div>

      {!currentUser && (
        <div style={{ margin:"8px 16px 12px", background:"#1E293B", borderRadius:12, padding:16, textAlign:"center" }}>
          <p style={{ fontSize:13, color:"#94A3B8", margin:"0 0 10px" }}>Connectez-vous pour pronostiquer</p>
          <button onClick={onLoginRequired} style={btn("#10B981","#fff")}>Se connecter</button>
        </div>
      )}

      {upcoming.length>0 && <><SectionTitle>À pronostiquer ({upcoming.length})</SectionTitle>
        {upcoming.map(m => <MatchCard key={m.id} match={m}
          pred={currentUser ? predsMap[currentUser.id]?.[m.id] : null}
          result={null} onPredict={currentUser?(h,a)=>onPredict(m.id,h,a):onLoginRequired} />)}</>}

      {done.length>0 && <><SectionTitle>Matchs terminés ({done.length})</SectionTitle>
        {done.map(m => <MatchCard key={m.id} match={m}
          pred={currentUser ? predsMap[currentUser.id]?.[m.id] : null}
          result={resultsMap[m.id]} onPredict={null} />)}</>}
    </div>
  );
}

function MatchCard({ match, pred, result, onPredict }) {
  const [h, setH] = useState(pred?.home_score ?? "");
  const [a, setA] = useState(pred?.away_score ?? "");
  const [saved, setSaved] = useState(false);
  const locked = !onPredict;
  const pts = result ? scoreForMatch(pred, result) : null;

  useEffect(() => {
    setH(pred?.home_score ?? "");
    setA(pred?.away_score ?? "");
  }, [pred]);

  function save() {
    if (h==="" || a==="") return;
    onPredict(h, a);
    setSaved(true); setTimeout(()=>setSaved(false), 1800);
  }

  const stageColors = { Finale:"#F59E0B", "3e place":"#0EA5E9", Demies:"#F97316", Quarts:"#EC4899", "16èmes":"#8B5CF6", "32èmes":"#A855F7", Groupes:"#3B82F6" };

  return (
    <div style={{ margin:"8px 16px", background:"#1E293B", borderRadius:12, overflow:"hidden",
      border: result ? "1px solid #334155" : "1px solid transparent" }}>
      <div style={{ background:"#0F172A", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ background:stageColors[match.stage]||"#334155", color:"#fff", fontSize:9,
            fontWeight:700, borderRadius:4, padding:"2px 6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>{match.stage}</span>
          <span style={{ fontSize:11, color:"#64748B" }}>{match.group}</span>
        </div>
        <span style={{ fontSize:11, color:"#64748B" }}>📅 {match.date} {match.time}</span>
      </div>

      <div style={{ padding:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ flex:1, fontSize:13, fontWeight:700, textAlign:"right", lineHeight:1.3 }}>{match.home}</span>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <ScoreInput value={h} onChange={locked?undefined:setH} readOnly={locked}/>
            <span style={{ color:"#475569", fontWeight:700 }}>–</span>
            <ScoreInput value={a} onChange={locked?undefined:setA} readOnly={locked}/>
          </div>
          <span style={{ flex:1, fontSize:13, fontWeight:700, textAlign:"left", lineHeight:1.3 }}>{match.away}</span>
        </div>

        {result && (
          <div style={{ marginTop:10, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            <span style={{ fontSize:12, color:"#94A3B8" }}>Résultat : <strong style={{color:"#F8FAFC"}}>{result.home_score}–{result.away_score}</strong></span>
            {pred ? <Badge pts={pts}/> : <span style={{ fontSize:11, color:"#475569", fontStyle:"italic" }}>Pas de pronostic</span>}
          </div>
        )}

        {!locked && (
          <div style={{ marginTop:12, display:"flex", justifyContent:"flex-end", gap:8, alignItems:"center" }}>
            {saved && <span style={{ fontSize:12, color:"#10B981" }}>✓ Enregistré !</span>}
            {pred && !saved && <span style={{ fontSize:11, color:"#64748B" }}>Pronostic actuel : {pred.home_score}–{pred.away_score}</span>}
            <button onClick={save} disabled={h===""||a===""} style={btn(h!==""&&a!==""?"#10B981":"#334155", "#fff")}>
              {pred ? "Modifier" : "Valider"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────

function LeaderboardView({ leaderboard, currentUser, matchesPlayed }) {
  const medals = ["🥇","🥈","🥉"];
  return (
    <div>
      <div style={{ background:"linear-gradient(135deg,#064E3B,#0F172A)", padding:"24px 20px", textAlign:"center" }}>
        <div style={{ fontSize:48 }}>🏆</div>
        <div style={{ fontWeight:800, fontSize:20, marginTop:4 }}>Classement</div>
        <div style={{ color:"#64748B", fontSize:12, marginTop:4 }}>{matchesPlayed} match{matchesPlayed>1?"s":""} disputé{matchesPlayed>1?"s":""} · Mise à jour en temps réel</div>
      </div>

      {leaderboard.length===0 ? (
        <div style={{ padding:40, textAlign:"center", color:"#64748B", fontSize:14 }}>
          Aucun participant encore.<br/>Partagez le lien à vos amis !
        </div>
      ) : (
        <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
          {leaderboard.map((u,i) => {
            const isMe = currentUser?.id === u.id;
            return (
              <div key={u.id} style={{
                background: isMe?"rgba(16,185,129,0.12)":"#1E293B",
                border: isMe?"1px solid #10B981":"1px solid transparent",
                borderRadius:12, padding:"12px 14px",
                display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:28, textAlign:"center", fontSize:i<3?20:14, fontWeight:700, color:i<3?undefined:"#475569" }}>
                  {i<3?medals[i]:i+1}
                </div>
                <Avatar user={u} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>
                    {u.username} {isMe&&<span style={{fontSize:11,color:"#10B981"}}>(moi)</span>}
                  </div>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>
                    🎯 {u.exact} exact · ✓ {u.correct} corrects
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:24, fontWeight:900, color:i===0?"#F59E0B":i===1?"#CBD5E1":i===2?"#B45309":"#F8FAFC" }}>{u.total}</div>
                  <div style={{ fontSize:10, color:"#64748B" }}>pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── RESULTS VIEW ────────────────────────────────────────────────────────────

function ResultsView({ matches, resultsMap, users, predsMap }) {
  if (matches.length===0) return (
    <div style={{ padding:48, textAlign:"center", color:"#64748B" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
      <div style={{ fontSize:14 }}>Les résultats s'afficheront ici au fur et à mesure.</div>
    </div>
  );
  return (
    <div style={{ padding:16 }}>
      <h2 style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>📊 Détail par match</h2>
      {matches.map(m => {
        const r = resultsMap[m.id];
        const rows = users.map(u => ({
          user:u, pred:predsMap[u.id]?.[m.id],
          pts:scoreForMatch(predsMap[u.id]?.[m.id], r)
        })).sort((a,b)=>b.pts-a.pts);
        return (
          <div key={m.id} style={{ background:"#1E293B", borderRadius:12, marginBottom:12, overflow:"hidden" }}>
            <div style={{ background:"#0F172A", padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontWeight:700, fontSize:13 }}>
                {m.home} <span style={{color:"#10B981",fontWeight:900}}>{r.home_score}–{r.away_score}</span> {m.away}
              </span>
              <span style={{ fontSize:11, color:"#64748B" }}>{m.date}</span>
            </div>
            <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:6 }}>
              {rows.map(({user,pred,pts}) => (
                <div key={user.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Avatar user={user} size={24}/>
                  <span style={{ flex:1, fontSize:12, fontWeight:600 }}>{user.username}</span>
                  <span style={{ fontSize:12, color:"#94A3B8" }}>
                    {pred ? `${pred.home_score}–${pred.away_score}` : <em style={{color:"#475569"}}>–</em>}
                  </span>
                  <Badge pts={pred?pts:0}/>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

function AdminPanel({ matches, resultsMap, onResult }) {
  const [sel, setSel] = useState(matches[0]?.id);
  const [h, setH] = useState("");
  const [a, setA] = useState("");
  const match = matches.find(m=>m.id===sel);
  const existing = resultsMap[sel];

  useEffect(() => {
    setH(existing?.home_score ?? "");
    setA(existing?.away_score ?? "");
  }, [sel, existing]);

  return (
    <div>
      <label style={{ fontSize:12, color:"#94A3B8", display:"block", marginBottom:6 }}>Match</label>
      <select value={sel} onChange={e=>setSel(Number(e.target.value))} style={{
        width:"100%", background:"#0F172A", color:"#F8FAFC",
        border:"1px solid #334155", borderRadius:8, padding:"8px 10px", fontSize:12, marginBottom:16 }}>
        {matches.map(m => (
          <option key={m.id} value={m.id}>
            {resultsMap[m.id]?"✅":"⬜"} {m.home} vs {m.away} — {m.date}
          </option>
        ))}
      </select>
      {match && (
        <div>
          <div style={{ fontSize:13, color:"#94A3B8", marginBottom:14, textAlign:"center" }}>
            {match.home} <strong style={{color:"#F8FAFC"}}>vs</strong> {match.away}
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:16 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>{match.home}</div>
              <ScoreInput value={h} onChange={setH}/>
            </div>
            <span style={{ fontWeight:700, color:"#475569", fontSize:18 }}>–</span>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>{match.away}</div>
              <ScoreInput value={a} onChange={setA}/>
            </div>
          </div>
          <button onClick={()=>onResult(sel,h,a)} disabled={h===""||a===""} style={btn("#10B981","#fff",true)}>
            {existing?"Mettre à jour":"Enregistrer le résultat"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AUTH FORM ────────────────────────────────────────────────────────────────

function AuthForm({ mode, onSubmit, onSwitch }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div>
      <p style={{ fontSize:13, color:"#94A3B8", marginBottom:16 }}>
        {mode==="register" ? "Choisissez un pseudo et un mot de passe." : "Entrez votre pseudo et mot de passe."}
      </p>
      <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Pseudo…"
        style={{ width:"100%", background:"#0F172A", border:"2px solid #334155", borderRadius:8,
          color:"#F8FAFC", padding:"10px 12px", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 }}/>
      <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Mot de passe…"
        onKeyDown={e=>e.key==="Enter"&&onSubmit(name,pass)}
        style={{ width:"100%", background:"#0F172A", border:"2px solid #334155", borderRadius:8,
          color:"#F8FAFC", padding:"10px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
      <button onClick={()=>onSubmit(name,pass)} style={{ ...btn("#10B981","#fff",true), marginTop:14 }}>
        {mode==="register" ? "Créer mon compte" : "Me connecter"}
      </button>
      <p style={{ textAlign:"center", fontSize:12, color:"#64748B", marginTop:12 }}>
        {mode==="register" ? "Déjà un compte ? " : "Pas encore de compte ? "}
        <button onClick={onSwitch} style={{ background:"none", border:"none", color:"#10B981", cursor:"pointer", fontSize:12, fontWeight:700 }}>
          {mode==="register" ? "Se connecter" : "S'inscrire"}
        </button>
      </p>
    </div>
  );
}
