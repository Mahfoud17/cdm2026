
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

// ─── TRADUCTION noms d'équipes (anglais API → français affiché) ─────────────
const TEAM_FR = {
  "Mexico":"🇲🇽 Mexique","South Africa":"🇿🇦 Afrique du Sud","Korea Republic":"🇰🇷 Corée du Sud",
  "Czechia":"🇨🇿 Tchéquie","Canada":"🇨🇦 Canada","Bosnia and Herzegovina":"🇧🇦 Bosnie-Herz.",
  "Qatar":"🇶🇦 Qatar","Switzerland":"🇨🇭 Suisse","Brazil":"🇧🇷 Brésil","Morocco":"🇲🇦 Maroc",
  "Haiti":"🇭🇹 Haïti","Scotland":"🏴 Écosse","United States":"🇺🇸 États-Unis","USA":"🇺🇸 États-Unis",
  "Paraguay":"🇵🇾 Paraguay","Australia":"🇦🇺 Australie","Turkey":"🇹🇷 Turquie","Türkiye":"🇹🇷 Turquie",
  "Germany":"🇩🇪 Allemagne","Curaçao":"🇨🇼 Curaçao","Ivory Coast":"🇨🇮 Côte d'Ivoire",
  "Côte d'Ivoire":"🇨🇮 Côte d'Ivoire","Ecuador":"🇪🇨 Équateur","Netherlands":"🇳🇱 Pays-Bas",
  "Japan":"🇯🇵 Japon","Senegal":"🇸🇳 Sénégal","Sweden":"🇸🇪 Suède","Tunisia":"🇹🇳 Tunisie",
  "Spain":"🇪🇸 Espagne","Belgium":"🇧🇪 Belgique","Iran":"🇮🇷 Iran","IR Iran":"🇮🇷 Iran",
  "New Zealand":"🇳🇿 Nouvelle-Zélande","Portugal":"🇵🇹 Portugal","Saudi Arabia":"🇸🇦 Arabie Saoudite",
  "Argentina":"🇦🇷 Argentine","Nigeria":"🇳🇬 Nigéria","France":"🇫🇷 France","Norway":"🇳🇴 Norvège",
  "Iraq":"🇮🇶 Irak","Uruguay":"🇺🇾 Uruguay","Cape Verde":"🇨🇻 Cap-Vert","Algeria":"🇩🇿 Algérie",
  "Austria":"🇦🇹 Autriche","Jordan":"🇯🇴 Jordanie","Poland":"🇵🇱 Pologne","Egypt":"🇪🇬 Egypte",
  "Serbia":"🇷🇸 Serbie","Colombia":"🇨🇴 Colombie","Uzbekistan":"🇺🇿 Ouzbékistan",
  "DR Congo":"🇨🇩 RD Congo","Congo DR":"🇨🇩 RD Congo","England":"🏴 Angleterre","Croatia":"🇭🇷 Croatie",
  "Ghana":"🇬🇭 Ghana","Panama":"🇵🇦 Panama",
};
function teamLabel(name) { return TEAM_FR[name] || ("🏳️ " + name); }

// Convertit une date UTC ISO en date+heure locale française (Europe/Paris) "YYYY-MM-DD" / "HH:MM"
function splitUtcToParis(utcDate) {
  const d = new Date(utcDate);
  const datePart = d.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" }); // YYYY-MM-DD
  const timePart = d.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour:"2-digit", minute:"2-digit", hour12:false });
  return { date: datePart, time: timePart };
}

const STAGE_MAP = {
  "GROUP_STAGE":     "Groupes",
  "LAST_32":         "32èmes",
  "LAST_16":         "16èmes",
  "QUARTER_FINALS":  "Quarts",
  "SEMI_FINALS":     "Demies",
  "THIRD_PLACE":     "3e place",
  "FINAL":           "Finale",
};

// ── Récupère le calendrier complet (104 matchs) depuis football-data.org
// et les enregistre/actualise dans la table Supabase "matches".
async function syncMatchesFromAPI() {
  if (!FOOTBALL_KEY) return;
  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/2000/matches",
      { headers: { "X-Auth-Token": FOOTBALL_KEY } }
    );
    if (!res.ok) return;
    const data = await res.json();
    const apiMatches = data.matches || [];
    if (apiMatches.length === 0) return;

    const rows = apiMatches.map(m => {
      const { date, time } = splitUtcToParis(m.utcDate);
      const group = m.group ? ("Groupe " + m.group.replace("GROUP_", "")) : "Phase finale";
      const stage = STAGE_MAP[m.stage] || m.stage || "Groupes";
      return {
        id: m.id,
        home: teamLabel(m.homeTeam?.name || m.homeTeam?.shortName || "À déterminer"),
        away: teamLabel(m.awayTeam?.name || m.awayTeam?.shortName || "À déterminer"),
        match_group: group,
        stage,
        match_date: date,
        match_time: time,
      };
    });

    await supabase.from("matches").upsert(rows, { onConflict: "id" });

    // Synchronise aussi les résultats des matchs terminés
    for (const m of apiMatches) {
      const hs = m.score?.fullTime?.home;
      const as_ = m.score?.fullTime?.away;
      if (hs === null || hs === undefined || as_ === null || as_ === undefined) continue;
      await supabase.from("results").upsert(
        { match_id: m.id, home_score: hs, away_score: as_ },
        { onConflict: "match_id" }
      );
    }
  } catch(e) { console.error("Erreur sync matchs API:", e); }
}

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
  const [matches,     setMatches]     = useState([]);
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
    const [u, p, r, m] = await Promise.all([
      supabase.from("users").select("*").order("created_at"),
      supabase.from("predictions").select("*"),
      supabase.from("results").select("*"),
      supabase.from("matches").select("*").order("match_date").order("match_time"),
    ]);
    if (u.data) setUsers(u.data);
    if (p.data) setPredictions(p.data);
    if (r.data) setResults(r.data);
    if (m.data) setMatches(m.data.map(x => ({
      id: x.id, home: x.home, away: x.away,
      group: x.match_group, stage: x.stage,
      date: x.match_date, time: x.match_time,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Sync automatique calendrier + résultats toutes les 5 minutes
  useEffect(() => {
    syncMatchesFromAPI().then(fetchAll);
    const interval = setInterval(() => {
      syncMatchesFromAPI().then(fetchAll);
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
            stats={{ users: users.length, played: results.length, remaining: matches.filter(m=>!resultsMap[m.id]).length }}
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
            matches={matches}
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
          <ResultsView matches={matches.filter(m=>resultsMap[m.id])} resultsMap={resultsMap} users={users} predsMap={predsMap} />
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
      {modal==="admin" && isAdmin && <Modal title="🔧 Saisie des résultats" onClose={()=>setModal(null)}><AdminPanel matches={matches} resultsMap={resultsMap} onResult={handleResult}/></Modal>}
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
  const now = Date.now();
  const hasMatchStarted = m => new Date(m.date + "T" + m.time + ":00").getTime() <= now;

  const upcoming = filtered.filter(m=>!resultsMap[m.id] && !hasMatchStarted(m));
  const live     = filtered.filter(m=>!resultsMap[m.id] &&  hasMatchStarted(m));
  const done     = filtered.filter(m=> resultsMap[m.id]);

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

      {matches.length===0 && (
        <div style={{ margin:"8px 16px 12px", background:"#1E293B", borderRadius:12, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
          <p style={{ fontSize:13, color:"#94A3B8", margin:0 }}>Chargement du calendrier des matchs depuis la FIFA…</p>
        </div>
      )}

      {!currentUser && matches.length>0 && (
        <div style={{ margin:"8px 16px 12px", background:"#1E293B", borderRadius:12, padding:16, textAlign:"center" }}>
          <p style={{ fontSize:13, color:"#94A3B8", margin:"0 0 10px" }}>Connectez-vous pour pronostiquer</p>
          <button onClick={onLoginRequired} style={btn("#10B981","#fff")}>Se connecter</button>
        </div>
      )}

      {upcoming.length>0 && <><SectionTitle>À pronostiquer ({upcoming.length})</SectionTitle>
        {upcoming.map(m => <MatchCard key={m.id} match={m}
          pred={currentUser ? predsMap[currentUser.id]?.[m.id] : null}
          result={null} onPredict={currentUser?(h,a)=>onPredict(m.id,h,a):onLoginRequired} />)}</>}

      {live.length>0 && <><SectionTitle>En cours / en attente du résultat ({live.length})</SectionTitle>
        {live.map(m => <MatchCard key={m.id} match={m}
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

  // Le match est verrouillé si le résultat est connu OU si l'heure du match est passée
  const matchDateTime = new Date(match.date + "T" + match.time + ":00");
  const hasStarted = matchDateTime.getTime() <= Date.now();
  const locked = !onPredict || hasStarted;

  const pts = result ? scoreForMatch(pred, result) : null;

  useEffect(() => {
    setH(pred?.home_score ?? "");
    setA(pred?.away_score ?? "");
  }, [pred]);

  function save() {
    if (h==="" || a==="") return;
    if (hasStarted) { alert("Ce match a déjà commencé, impossible de modifier le pronostic."); return; }
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

        {!result && hasStarted && (
          <div style={{ marginTop:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ fontSize:11, color:"#F59E0B", fontWeight:600 }}>🔒 Match commencé — en attente du résultat</span>
            {pred && <span style={{ fontSize:11, color:"#64748B" }}>(votre pronostic : {pred.home_score}–{pred.away_score})</span>}
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
