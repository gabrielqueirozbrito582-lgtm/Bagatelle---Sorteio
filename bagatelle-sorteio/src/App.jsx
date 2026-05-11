import { useState, useEffect } from "react";

// ── STORAGE HELPERS ──────────────────────────────────────
function loadPlayers() {
  try {
    const saved = localStorage.getItem("bagatelle_players");
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return null;
}
function savePlayers(players) {
  try {
    const toSave = players.map(p => ({ ...p, photo: p.photo && p.photo.length < 50000 ? p.photo : null }));
    localStorage.setItem("bagatelle_players", JSON.stringify(toSave));
  } catch(e) {}
}

const ADMIN_PASSWORD = "bagatelle2026";
const TEAM_SIZE = 8; // máximo por time

const initialPlayers = [
  { id: 1, name: "Carlos Silva", age: 28, position: "GOL", level: 8, photo: null, characteristics: ["Reflexos rápidos", "Boa saída"], present: false, type: "mensalista" },
  { id: 2, name: "João Melo", age: 32, position: "ZAG", level: 7, photo: null, characteristics: ["Forte no aéreo", "Liderança"], present: false, type: "mensalista" },
  { id: 3, name: "Pedro Alves", age: 25, position: "ZAG", level: 6, photo: null, characteristics: ["Velocidade", "Marcação"], present: false, type: "mensalista" },
  { id: 4, name: "Lucas Rocha", age: 29, position: "LAT", level: 7, photo: null, characteristics: ["Cruzamento", "Resistência"], present: false, type: "mensalista" },
  { id: 5, name: "André Costa", age: 24, position: "LAT", level: 6, photo: null, characteristics: ["Velocidade", "Drible"], present: false, type: "mensalista" },
  { id: 6, name: "Bruno Lima", age: 31, position: "VOL", level: 8, photo: null, characteristics: ["Desarme", "Visão de jogo"], present: false, type: "mensalista" },
  { id: 7, name: "Felipe Souza", age: 27, position: "MEI", level: 7, photo: null, characteristics: ["Passe", "Dribles"], present: false, type: "mensalista" },
  { id: 8, name: "Thiago Nunes", age: 23, position: "MEI", level: 6, photo: null, characteristics: ["Chute de fora", "Garra"], present: false, type: "mensalista" },
  { id: 9, name: "Rodrigo Pires", age: 30, position: "ATA", level: 9, photo: null, characteristics: ["Velocidade", "Finalização"], present: false, type: "mensalista" },
  { id: 10, name: "Gustavo Mendes", age: 26, position: "ATA", level: 7, photo: null, characteristics: ["Cabeceio", "Dribles"], present: false, type: "mensalista" },
];

const POSITIONS = ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA"];
const POSITION_LABELS = { GOL: "Goleiro", ZAG: "Zagueiro", LAT: "Lateral", VOL: "Volante", MEI: "Meia", ATA: "Atacante" };
const POS_COLOR = { GOL: "#f59e0b", ZAG: "#38bdf8", LAT: "#06b6d4", VOL: "#818cf8", MEI: "#34d399", ATA: "#f87171" };
const TEAM_COLORS = ["#38bdf8", "#f87171", "#34d399", "#f59e0b", "#818cf8", "#fb923c"];
const TEAM_NAMES = ["Time A", "Time B", "Time C", "Time D", "Time E", "Time F"];

function getInitials(name) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

// ── ALGORITMO DE SORTEIO MULTI-TIMES ────────────────────
function multiTeamDraw(presentPlayers) {
  const mensalistas = presentPlayers.filter(p => p.type === "mensalista");
  const avulsos = presentPlayers.filter(p => p.type === "avulso");

  const total = mensalistas.length;
  if (total < 2) return null;

  // Quantos times cabem com mensalistas (TEAM_SIZE por time)
  const numTeams = Math.max(2, Math.ceil(total / TEAM_SIZE));

  // Inicializa times vazios
  const teams = Array.from({ length: numTeams }, () => []);

  // Snake draft com mensalistas (ordenados por nível)
  const sorted = [...mensalistas].sort((a, b) => b.level - a.level);
  sorted.forEach((p, i) => {
    const round = Math.floor(i / numTeams);
    const pos = i % numTeams;
    const teamIdx = round % 2 === 0 ? pos : numTeams - 1 - pos;
    teams[teamIdx].push(p);
  });

  // Avulsos vão para o "time extra" (time C em diante) — nunca no A ou B
  // Se só tem 2 times, avulsos vão para um Time C separado
  avulsos.forEach(a => {
    if (numTeams >= 3) {
      // Coloca no time com menos jogadores entre os extras (idx >= 2)
      const extraTeams = teams.slice(2);
      const minIdx = extraTeams.reduce((mi, t, i) => t.length < extraTeams[mi].length ? i : mi, 0);
      teams[minIdx + 2].push(a);
    } else {
      // Cria time C para avulsos
      if (!teams[2]) teams[2] = [];
      teams[2].push(a);
    }
  });

  return teams.filter(t => t.length > 0).map((players, i) => ({
    name: TEAM_NAMES[i],
    color: TEAM_COLORS[i],
    players,
    score: players.filter(p => p.type === "mensalista").reduce((s, p) => s + p.level, 0),
    hasAvulsos: players.some(p => p.type === "avulso"),
  }));
}

// ── ESCUDO ORIGINAL (versão 1) ───────────────────────────
function BagatelleCrest({ size = 140 }) {
  return (
    <div style={{
      width: size, height: size,
      background: "linear-gradient(135deg, #1e3a5f, #0e2244)",
      border: `3px solid #38bdf8`,
      borderRadius: "50% 50% 45% 45%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 30px rgba(56,189,248,0.3)",
      padding: "10px 14px 14px",
      boxSizing: "border-box",
      gap: 1,
    }}>
      <div style={{ fontSize: size * 0.13, color: "#f59e0b", lineHeight: 1 }}>★</div>
      <div style={{ fontSize: size * 0.22, lineHeight: 1 }}>⚽</div>
      <div style={{ fontSize: size * 0.09, fontWeight: 900, color: "#f1f5f9", letterSpacing: 1.5, fontFamily: "Georgia, serif", lineHeight: 1.1 }}>BAGATELLE</div>
      <div style={{ fontSize: size * 0.055, color: "#38bdf8", letterSpacing: 3, lineHeight: 1.4 }}>★ ★ ★ ★ ★</div>
      <div style={{ fontSize: size * 0.05, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, lineHeight: 1.2 }}>FOOTBALL SOCIETY</div>
      <div style={{ fontSize: size * 0.045, color: "#64748b", letterSpacing: 1, lineHeight: 1.2 }}>SINCE · 2016</div>
    </div>
  );
}

function BagatelleCrestMini({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size,
      background: "linear-gradient(135deg, #1e3a5f, #0e2244)",
      border: `2px solid #38bdf8`,
      borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 12px rgba(56,189,248,0.3)",
      fontSize: size * 0.5,
    }}>⚽</div>
  );
}

// ── LOGIN ────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);
  const [show, setShow] = useState(false);

  function tryLogin() {
    if (pw === ADMIN_PASSWORD) { onLogin(); }
    else { setErr(true); setShake(true); setTimeout(() => setShake(false), 500); }
  }

  return (
    <div style={ls.root}>
      <div style={ls.fieldBg}>
        {[...Array(8)].map((_, i) => <div key={i} style={{ ...ls.fieldLine, top: `${10 + i * 11}%` }} />)}
        <div style={ls.fieldCircle} />
      </div>
      <div style={ls.card}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ filter: "drop-shadow(0 0 22px rgba(56,189,248,0.4))", animation: "float 3s ease-in-out infinite" }}>
            <BagatelleCrest size={150} />
          </div>
        </div>
        <h1 style={ls.title}>Área do Administrador</h1>
        <p style={ls.sub}>Digite a senha para acessar o painel</p>
        <div style={{ ...ls.inputWrap, animation: shake ? "shake 0.4s" : "none", borderColor: err ? "#ef4444" : "#1e3a5f" }}>
          <span style={ls.lockIcon}>🔒</span>
          <input style={ls.input} type={show ? "text" : "password"} placeholder="Senha do administrador"
            value={pw} onChange={e => { setPw(e.target.value); setErr(false); }}
            onKeyDown={e => e.key === "Enter" && tryLogin()} />
          <button style={ls.eyeBtn} onClick={() => setShow(s => !s)}>{show ? "🙈" : "👁"}</button>
        </div>
        {err && <div style={ls.errMsg}>❌ Senha incorreta. Tente novamente.</div>}
        <button style={ls.loginBtn} onClick={tryLogin}>Entrar no Painel</button>
        <div style={{ textAlign: "center" }}><span style={{ fontSize: 11, color: "#334155" }}>Acesso exclusivo · Bagatelle FC · Since 2016</span></div>
      </div>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}

const ls = {
  root: { minHeight: "100vh", background: "linear-gradient(160deg, #0a1628 0%, #0e2244 50%, #0a1628 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", overflow: "hidden" },
  fieldBg: { position: "absolute", inset: 0, pointerEvents: "none" },
  fieldLine: { position: "absolute", left: 0, right: 0, height: 1, background: "rgba(56,189,248,0.06)" },
  fieldCircle: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(56,189,248,0.06)" },
  card: { background: "rgba(10,22,40,0.97)", border: "1px solid #1e3a5f", borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 380, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" },
  title: { fontSize: 20, fontWeight: 800, color: "#f1f5f9", textAlign: "center", margin: "0 0 6px" },
  sub: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 20 },
  inputWrap: { display: "flex", alignItems: "center", background: "#0e1e30", border: "1.5px solid #1e3a5f", borderRadius: 12, padding: "0 12px", marginBottom: 10, gap: 8 },
  lockIcon: { fontSize: 16 },
  input: { flex: 1, background: "none", border: "none", outline: "none", color: "#f1f5f9", fontSize: 15, padding: "13px 0", fontFamily: "monospace", letterSpacing: 2 },
  eyeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4 },
  errMsg: { fontSize: 13, color: "#ef4444", textAlign: "center", marginBottom: 10, background: "#450a0a44", borderRadius: 8, padding: 7 },
  loginBtn: { width: "100%", padding: 14, background: "linear-gradient(135deg, #0ea5e9, #1d4ed8)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 16, boxShadow: "0 4px 20px rgba(14,165,233,0.3)" },
};

// ── MODAL DE CONFIRMAÇÃO ─────────────────────────────────
function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div style={modal.overlay}>
      <div style={modal.box}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "#f1f5f9" }}>Tem certeza?</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20, lineHeight: 1.5 }}>{msg}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={modal.cancelBtn} onClick={onCancel}>Cancelar</button>
          <button style={modal.confirmBtn} onClick={onConfirm}>Apagar tudo</button>
        </div>
      </div>
    </div>
  );
}
const modal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  box: { background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 20, padding: "28px 24px", maxWidth: 340, width: "100%", textAlign: "center" },
  cancelBtn: { flex: 1, padding: "11px", background: "#1e293b", border: "none", borderRadius: 10, color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: "11px", background: "#ef4444", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" },
};

// ── MAIN APP ─────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState("home");
  const [players, setPlayers] = useState(() => loadPlayers() || initialPlayers);

  // Save players to localStorage whenever they change
  useEffect(() => { savePlayers(players); }, [players]);
  const [drawResult, setDrawResult] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [newChar, setNewChar] = useState("");
  const [form, setForm] = useState({ name: "", age: "", position: "GOL", level: 5, characteristics: [], photo: null });
  const [drawAnim, setDrawAnim] = useState(false);
  // Avulso
  const [avulsoName, setAvulsoName] = useState("");
  const [showAvulsoInput, setShowAvulsoInput] = useState(false);
  // Confirmações
  const [confirmPresence, setConfirmPresence] = useState(false);
  const [confirmDraw, setConfirmDraw] = useState(false);

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;

  const presentPlayers = players.filter(p => p.present);
  const mensalistasPresentes = presentPlayers.filter(p => p.type === "mensalista");
  const avulsosPresentes = presentPlayers.filter(p => p.type === "avulso");
  const avgLevel = players.filter(p => p.type === "mensalista").length
    ? (players.filter(p => p.type === "mensalista").reduce((s, p) => s + p.level, 0) / players.filter(p => p.type === "mensalista").length).toFixed(1)
    : 0;

  function openAddPlayer() { setEditingPlayer(null); setForm({ name: "", age: "", position: "GOL", level: 5, characteristics: [], photo: null }); setView("playerForm"); }
  function openEditPlayer(player) { setEditingPlayer(player); setForm({ ...player, characteristics: [...player.characteristics] }); setView("playerForm"); }
  function savePlayer() {
    if (!form.name.trim()) return;
    if (editingPlayer) setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...form, age: Number(form.age) } : p));
    else setPlayers(prev => [...prev, { ...form, id: Date.now(), age: Number(form.age), present: false, type: "mensalista" }]);
    setView("players");
  }
  function deletePlayer(id) { setPlayers(prev => prev.filter(p => p.id !== id)); }
  function togglePresence(id) { setPlayers(prev => prev.map(p => p.id === id ? { ...p, present: !p.present } : p)); }

  function addAvulso() {
    if (!avulsoName.trim()) return;
    const novo = { id: Date.now(), name: avulsoName.trim(), age: null, position: "ATA", level: 5, photo: null, characteristics: [], present: true, type: "avulso" };
    setPlayers(prev => [...prev, novo]);
    setAvulsoName("");
    setShowAvulsoInput(false);
  }
  function removeAvulsos() {
    setPlayers(prev => prev.filter(p => p.type !== "avulso"));
  }

  function handleDraw() {
    if (mensalistasPresentes.length < 2) return;
    setDrawAnim(true);
    setTimeout(() => { setDrawResult(multiTeamDraw(presentPlayers)); setDrawAnim(false); setView("draw"); }, 1800);
  }

  function clearPresence() {
    setPlayers(prev => prev.map(p => ({ ...p, present: false })).filter(p => p.type !== "avulso"));
    setConfirmPresence(false);
  }
  function clearDraw() {
    setDrawResult(null);
    setConfirmDraw(false);
  }

  function addChar() { if (!newChar.trim()) return; setForm(f => ({ ...f, characteristics: [...f.characteristics, newChar.trim()] })); setNewChar(""); }
  function removeChar(i) { setForm(f => ({ ...f, characteristics: f.characteristics.filter((_, idx) => idx !== i) })); }
  function handlePhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, photo: ev.target.result }));
    reader.readAsDataURL(file);
  }
  const navTo = (v) => { if (v === "draw" && drawResult) setView("draw"); else if (v !== "draw") setView(v); else setView("home"); };

  const numTeamsPrev = mensalistasPresentes.length >= 2 ? Math.max(2, Math.ceil(mensalistasPresentes.length / TEAM_SIZE)) : 0;

  return (
    <div style={s.root}>
      {confirmPresence && <ConfirmModal msg="Isso vai limpar todas as presenças e remover os avulsos do dia." onConfirm={clearPresence} onCancel={() => setConfirmPresence(false)} />}
      {confirmDraw && <ConfirmModal msg="Isso vai apagar o resultado do sorteio atual." onConfirm={clearDraw} onCancel={() => setConfirmDraw(false)} />}

      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <button style={s.logoBtn} onClick={() => setView("home")}>
            <BagatelleCrestMini size={36} />
            <div>
              <div style={s.logoName}>BAGATELLE</div>
              <div style={s.logoSub}>Football Society</div>
            </div>
          </button>
          <button style={s.logoutBtn} onClick={() => setLoggedIn(false)}>🔓 Sair</button>
        </div>
        <div style={s.navBar}>
          {[["home","🏠","Início"],["players","👥","Elenco"],["presence","✅","Presença"],["draw","⚽","Sorteio"]].map(([v,icon,label]) => (
            <button key={v} style={{ ...s.navBtn, color: view===v?"#38bdf8":"#475569", borderBottom: view===v?"2px solid #38bdf8":"2px solid transparent" }} onClick={() => navTo(v)}>
              {icon} {label}
            </button>
          ))}
        </div>
      </header>

      <main style={s.main}>

        {/* ── HOME ── */}
        {view === "home" && (
          <div style={s.page}>
            <div style={s.hero}>
              <div style={s.heroGlow} />
              <div style={{ filter: "drop-shadow(0 0 28px rgba(56,189,248,0.3))" }}>
                <BagatelleCrest size={160} />
              </div>
              <h1 style={s.heroTitle}>Bagatelle<br /><span style={s.heroAccent}>Sorteio</span></h1>
              <p style={s.heroSub}>Campo 7 · Times de 8 · Nivelados por posição e habilidade.</p>
            </div>

            <div style={s.statsRow}>
              <button style={{ ...s.statCard, borderColor: "#38bdf833" }} onClick={() => setView("players")}>
                <span style={{ fontSize: 22 }}>👥</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#38bdf8", lineHeight: 1 }}>{players.filter(p=>p.type==="mensalista").length}</span>
                <span style={s.statLabel}>MENSALISTAS</span>
                <span style={s.statHint}>ver elenco →</span>
              </button>
              <button style={{ ...s.statCard, borderColor: "#34d39933" }} onClick={() => setView("presence")}>
                <span style={{ fontSize: 22 }}>✅</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#34d399", lineHeight: 1 }}>{presentPlayers.length}</span>
                <span style={s.statLabel}>PRESENTES</span>
                <span style={s.statHint}>marcar →</span>
              </button>
              <button style={{ ...s.statCard, borderColor: "#f59e0b33" }} onClick={() => setView("players")}>
                <span style={{ fontSize: 22 }}>⭐</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>{avgLevel}</span>
                <span style={s.statLabel}>NÍV. MÉDIO</span>
                <span style={s.statHint}>ver elenco →</span>
              </button>
            </div>

            <div style={s.drawCard}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>⚽ Pronto para sortear?</span>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  {mensalistasPresentes.length} mensalista{mensalistasPresentes.length!==1?"s":""} · {avulsosPresentes.length} avulso{avulsosPresentes.length!==1?"s":""}
                  {numTeamsPrev > 0 && <span style={{ color: "#38bdf8" }}> → {numTeamsPrev} time{numTeamsPrev>1?"s":""}</span>}
                </span>
              </div>
              {mensalistasPresentes.length < 2 && (
                <div style={s.warn}>⚠️ Confirme ao menos 2 mensalistas em <strong>Presença</strong>.</div>
              )}
              <button style={{ ...s.drawBtn, opacity: mensalistasPresentes.length < 2 || drawAnim ? 0.5 : 1 }}
                onClick={handleDraw} disabled={mensalistasPresentes.length < 2 || drawAnim}>
                {drawAnim ? "🔄 Sorteando times..." : "⚽ Sortear Times Agora"}
              </button>
              {drawResult && <button style={s.seeResultBtn} onClick={() => setView("draw")}>Ver último resultado →</button>}
            </div>
          </div>
        )}

        {/* ── PLAYERS ── */}
        {view === "players" && (
          <div style={s.page}>
            <div style={s.pageHeader}>
              <h2 style={s.pageTitle}>Elenco</h2>
              <button style={s.addBtn} onClick={openAddPlayer}>+ Adicionar</button>
            </div>
            <div style={s.playerList}>
              {players.filter(p=>p.type==="mensalista").map(p => (
                <div key={p.id} style={s.playerCard}>
                  <div style={s.pcLeft}>
                    <div style={{ ...s.avatar, background: POS_COLOR[p.position]+"22", border:`2px solid ${POS_COLOR[p.position]}` }}>
                      {p.photo ? <img src={p.photo} alt="" style={s.avatarImg}/> : <span style={{ fontSize:14, fontWeight:800, color:POS_COLOR[p.position] }}>{getInitials(p.name)}</span>}
                    </div>
                    <div>
                      <div style={s.pName}>{p.name}</div>
                      <div style={s.pMeta}>
                        <span style={{ ...s.posTag, background:POS_COLOR[p.position]+"22", color:POS_COLOR[p.position], border:`1px solid ${POS_COLOR[p.position]}44` }}>{POSITION_LABELS[p.position]}</span>
                        <span style={s.pAge}>{p.age} anos</span>
                      </div>
                    </div>
                  </div>
                  <div style={s.pcRight}>
                    <div style={s.levelBadge}><span style={s.lvNum}>{p.level}</span><span style={s.lvStar}>★</span></div>
                    <div style={s.actions}>
                      <button style={s.iBtn} onClick={() => { setDetailPlayer(p); setView("playerDetail"); }}>👁</button>
                      <button style={s.iBtn} onClick={() => openEditPlayer(p)}>✏️</button>
                      <button style={{ ...s.iBtn, color:"#ef4444" }} onClick={() => deletePlayer(p.id)}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
              {players.filter(p=>p.type==="mensalista").length === 0 && <div style={s.empty}>Nenhum mensalista cadastrado.</div>}
            </div>
          </div>
        )}

        {/* ── PLAYER DETAIL ── */}
        {view === "playerDetail" && detailPlayer && (() => {
          const p = players.find(x => x.id === detailPlayer.id) || detailPlayer;
          return (
            <div style={s.page}>
              <button style={s.backBtn} onClick={() => setView("players")}>← Voltar</button>
              <div style={s.detailCard}>
                <div style={{ background:`radial-gradient(circle at 50% 40%, ${POS_COLOR[p.position]}33, transparent 70%)`, padding:"24px 0 10px", display:"flex", justifyContent:"center" }}>
                  <div style={{ ...s.detailAv, background:POS_COLOR[p.position]+"22", border:`3px solid ${POS_COLOR[p.position]}` }}>
                    {p.photo ? <img src={p.photo} alt="" style={s.avatarImg}/> : <span style={{ fontSize:30, fontWeight:800, color:POS_COLOR[p.position] }}>{getInitials(p.name)}</span>}
                  </div>
                </div>
                <h2 style={s.detailName}>{p.name}</h2>
                <div style={s.detailMeta}>
                  <span style={{ ...s.posTagLg, background:POS_COLOR[p.position]+"22", color:POS_COLOR[p.position], border:`1px solid ${POS_COLOR[p.position]}` }}>{POSITION_LABELS[p.position]}</span>
                  <span style={{ fontSize:13, color:"#94a3b8" }}>🎂 {p.age} anos</span>
                  <span style={{ color:"#f59e0b", fontWeight:700, fontSize:13 }}>⭐ Nível {p.level}/10</span>
                </div>
                <div style={s.lvBar}><div style={{ ...s.lvBarFill, width:`${p.level*10}%`, background:POS_COLOR[p.position] }}/></div>
                {p.characteristics.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={s.secLabel}>Características</div>
                    <div style={s.chipRow}>{p.characteristics.map((c,i) => <span key={i} style={s.chip}>{c}</span>)}</div>
                  </div>
                )}
                <div style={s.presLine}>
                  <span>Status hoje:</span>
                  <span style={{ color:p.present?"#34d399":"#475569", fontWeight:700 }}>{p.present?"✅ Confirmado":"❌ Não confirmado"}</span>
                </div>
                <button style={s.editBtn} onClick={() => openEditPlayer(p)}>Editar Jogador</button>
              </div>
            </div>
          );
        })()}

        {/* ── PLAYER FORM ── */}
        {view === "playerForm" && (
          <div style={s.page}>
            <button style={s.backBtn} onClick={() => setView("players")}>← Voltar</button>
            <h2 style={s.pageTitle}>{editingPlayer ? "Editar Jogador" : "Novo Jogador"}</h2>
            <div style={s.formCard}>
              <div style={{ display:"flex", justifyContent:"center" }}>
                <label style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={s.photoPrev}>
                    {form.photo ? <img src={form.photo} alt="" style={s.avatarImg}/> : <span style={{ fontSize:26 }}>📷</span>}
                  </div>
                  <span style={{ fontSize:12, color:"#64748b" }}>Foto (opcional)</span>
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto}/>
                </label>
              </div>
              <Lbl>Nome<input style={s.inp} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Nome completo"/></Lbl>
              <Lbl>Idade<input style={s.inp} type="number" value={form.age} onChange={e => setForm(f=>({...f,age:e.target.value}))} placeholder="Ex: 25"/></Lbl>
              <Lbl>Posição
                <select style={s.inp} value={form.position} onChange={e => setForm(f=>({...f,position:e.target.value}))}>
                  {POSITIONS.map(pos => <option key={pos} value={pos}>{POSITION_LABELS[pos]}</option>)}
                </select>
              </Lbl>
              <Lbl>Nível — <span style={{ color:"#38bdf8", fontWeight:800 }}>{form.level}/10</span>
                <input type="range" min={1} max={10} value={form.level} onChange={e => setForm(f=>({...f,level:Number(e.target.value)}))} style={s.range}/>
                <div style={{ display:"flex", gap:4, marginTop:4 }}>
                  {[...Array(10)].map((_,i) => <div key={i} style={{ flex:1, height:5, borderRadius:3, background:i<form.level?"#38bdf8":"#1e293b" }}/>)}
                </div>
              </Lbl>
              <Lbl>Características
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ ...s.inp, flex:1 }} value={newChar} onChange={e=>setNewChar(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addChar()} placeholder="Ex: Velocidade..."/>
                  <button style={s.addCBtn} onClick={addChar}>+</button>
                </div>
                <div style={s.chipRow}>{form.characteristics.map((c,i) => <span key={i} style={{ ...s.chip, cursor:"pointer" }} onClick={()=>removeChar(i)}>{c} ×</span>)}</div>
              </Lbl>
              <button style={s.saveBtn} onClick={savePlayer}>{editingPlayer?"Salvar Alterações":"Adicionar Jogador"}</button>
            </div>
          </div>
        )}

        {/* ── PRESENCE ── */}
        {view === "presence" && (
          <div style={s.page}>
            <div style={s.pageHeader}>
              <h2 style={s.pageTitle}>Presença</h2>
              <span style={s.presCount}>{presentPlayers.length} presentes</span>
            </div>

            {/* Resumo */}
            <div style={s.presSummary}>
              <span>👥 {mensalistasPresentes.length} mensalista{mensalistasPresentes.length!==1?"s":""}</span>
              <span>🎟️ {avulsosPresentes.length} avulso{avulsosPresentes.length!==1?"s":""}</span>
              {numTeamsPrev > 0 && <span style={{ color:"#38bdf8" }}>⚽ {numTeamsPrev} time{numTeamsPrev>1?"s":""}</span>}
            </div>

            {/* Botão avulso */}
            <div style={s.avulsoSection}>
              {!showAvulsoInput ? (
                <button style={s.avulsoBtn} onClick={() => setShowAvulsoInput(true)}>
                  🎟️ Adicionar Avulso do Dia
                </button>
              ) : (
                <div style={s.avulsoInputRow}>
                  <input style={{ ...s.inp, flex: 1 }} value={avulsoName} onChange={e => setAvulsoName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addAvulso()} placeholder="Nome do avulso..." autoFocus />
                  <button style={s.addCBtn} onClick={addAvulso}>✓</button>
                  <button style={{ ...s.addCBtn, background: "#1e293b" }} onClick={() => { setShowAvulsoInput(false); setAvulsoName(""); }}>✕</button>
                </div>
              )}
            </div>

            {/* Avulsos presentes */}
            {avulsosPresentes.length > 0 && (
              <div style={s.avulsoList}>
                <div style={s.secLabel}>🎟️ Avulsos do dia</div>
                {avulsosPresentes.map(a => (
                  <div key={a.id} style={s.avulsoItem}>
                    <div style={s.avulsoAvatar}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b" }}>{getInitials(a.name)}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{a.name}</span>
                    <span style={s.avulsoTag}>Avulso</span>
                    <button style={{ ...s.iBtn, color: "#ef4444", fontSize: 16 }} onClick={() => deletePlayer(a.id)}>🗑</button>
                  </div>
                ))}
              </div>
            )}

            {/* Mensalistas */}
            <div style={{ ...s.secLabel, marginBottom: 8 }}>👥 Mensalistas</div>
            <div style={s.presGrid}>
              {players.filter(p=>p.type==="mensalista").map(p => (
                <button key={p.id} onClick={()=>togglePresence(p.id)}
                  style={{ ...s.presCard, background:p.present?"#052e1699":"#0a0f1e", border:`1.5px solid ${p.present?"#34d399":"#1e293b"}` }}>
                  <div style={{ ...s.presAv, background:(p.present?"#16a34a":POS_COLOR[p.position])+"22", border:`2px solid ${p.present?"#34d399":POS_COLOR[p.position]}` }}>
                    {p.photo ? <img src={p.photo} alt="" style={s.avatarImg}/> : <span style={{ fontSize:13, fontWeight:800, color:p.present?"#34d399":POS_COLOR[p.position] }}>{getInitials(p.name)}</span>}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, textAlign:"center", lineHeight:1.2 }}>{p.name}</div>
                  <div style={{ ...s.posTagSm, background:POS_COLOR[p.position]+"22", color:POS_COLOR[p.position] }}>{p.position}</div>
                  <div style={{ fontSize:16 }}>{p.present?"✅":"⬜"}</div>
                </button>
              ))}
            </div>

            {/* Ações */}
            <div style={s.presActions}>
              {mensalistasPresentes.length >= 2 && (
                <button style={s.drawBtn} onClick={handleDraw} disabled={drawAnim}>
                  {drawAnim?"🔄 Sorteando...":`⚽ Sortear ${presentPlayers.length} Jogadores`}
                </button>
              )}
              <button style={s.clearBtn} onClick={() => setConfirmPresence(true)}>
                🗑 Apagar tudo e recomeçar
              </button>
            </div>
          </div>
        )}

        {/* ── DRAW ── */}
        {view === "draw" && drawResult && (
          <div style={s.page}>
            <div style={s.pageHeader}>
              <h2 style={s.pageTitle}>Times Sorteados</h2>
              <button style={s.reshuffleBtn} onClick={handleDraw} disabled={drawAnim}>🔄 Novo</button>
            </div>

            {/* Info de avulsos */}
            {drawResult.some(t => t.hasAvulsos) && (
              <div style={s.avulsoInfo}>
                🎟️ Avulsos foram alocados ao time extra (não jogam o 1º jogo)
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:12 }}>
              {drawResult.map((team) => (
                <div key={team.name} style={{ ...s.teamCard, border:`2px solid ${team.color}44` }}>
                  <div style={{ padding:"10px 14px", background:team.color+"22", borderBottom:`1px solid ${team.color}33`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:16, fontWeight:900, color:team.color }}>{team.name}</span>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      {team.hasAvulsos && <span style={s.avulsoTagSm}>Tem avulso</span>}
                      <span style={{ fontSize:12, fontWeight:700, color:team.color }}>⭐ {team.score} pts</span>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
                    {[...team.players].sort((a,b)=>POSITIONS.indexOf(a.position)-POSITIONS.indexOf(b.position)).map(p => (
                      <div key={p.id} style={{ ...s.teamRow, opacity: p.type==="avulso" ? 0.7 : 1 }}>
                        <div style={{ ...s.teamAv, background:(p.type==="avulso"?"#f59e0b":POS_COLOR[p.position])+"22", border:`1.5px solid ${p.type==="avulso"?"#f59e0b":POS_COLOR[p.position]}` }}>
                          {p.photo ? <img src={p.photo} alt="" style={s.avatarImg}/> : <span style={{ fontSize:10, fontWeight:800, color:p.type==="avulso"?"#f59e0b":POS_COLOR[p.position] }}>{getInitials(p.name)}</span>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</div>
                          <span style={{ ...s.posTagSm, background:(p.type==="avulso"?"#f59e0b":POS_COLOR[p.position])+"22", color:p.type==="avulso"?"#f59e0b":POS_COLOR[p.position] }}>
                            {p.type==="avulso"?"AVULSO":p.position}
                          </span>
                        </div>
                        {p.type==="mensalista" && <span style={{ fontSize:10, color:"#f59e0b", fontWeight:700, flexShrink:0 }}>{p.level}★</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Equilíbrio entre times mensalistas */}
            {drawResult.length >= 2 && (() => {
              const scores = drawResult.filter(t=>!t.hasAvulsos||t.players.some(p=>p.type==="mensalista")).map(t=>t.score);
              const diff = Math.max(...scores) - Math.min(...scores);
              return (
                <div style={s.balanceBar}>
                  <span>Diferença máx: <strong style={{ color: diff<=3?"#34d399":"#f59e0b" }}>{diff} pts</strong></span>
                  {diff<=3 && <span style={{ color:"#34d399" }}>✅ Equilibrado!</span>}
                </div>
              );
            })()}

            <button style={{ ...s.clearBtn, marginTop: 10 }} onClick={() => setConfirmDraw(true)}>
              🗑 Apagar resultado do sorteio
            </button>
          </div>
        )}

        {view === "draw" && !drawResult && (
          <div style={s.page}>
            <div style={s.empty}>Nenhum sorteio ainda.<br/>Confirme presenças e sorteie.</div>
            <button style={s.drawBtn} onClick={()=>setView("presence")}>Ir para Presença</button>
          </div>
        )}

      </main>

      <div style={s.bottomNav}>
        {[["home","🏠","Início"],["players","👥","Elenco"],["presence","✅","Presença"],["draw","⚽","Sorteio"]].map(([v,icon,label]) => (
          <button key={v} style={{ ...s.bBtn, color:view===v?"#38bdf8":"#475569" }} onClick={()=>navTo(v)}>
            <span style={{ fontSize:20 }}>{icon}</span>
            <span style={{ fontSize:10, fontWeight:view===v?700:400 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Lbl({ children }) {
  return <label style={{ display:"flex", flexDirection:"column", gap:6, fontSize:13, fontWeight:600, color:"#94a3b8" }}>{children}</label>;
}

const s = {
  root:{ minHeight:"100vh", background:"#060e1e", color:"#f1f5f9", fontFamily:"'Segoe UI',system-ui,sans-serif", display:"flex", flexDirection:"column", paddingBottom:64 },
  header:{ background:"#04080f", borderBottom:"1px solid #1e3a5f", position:"sticky", top:0, zIndex:50 },
  headerInner:{ maxWidth:600, margin:"0 auto", padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  logoBtn:{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10 },
  logoName:{ color:"#f1f5f9", fontWeight:900, fontSize:14, letterSpacing:1.5, fontFamily:"Georgia,serif", lineHeight:1 },
  logoSub:{ color:"#64748b", fontSize:9, letterSpacing:1, textTransform:"uppercase" },
  logoutBtn:{ background:"none", border:"1px solid #1e3a5f", borderRadius:8, color:"#64748b", padding:"5px 10px", fontSize:12, cursor:"pointer" },
  navBar:{ maxWidth:600, margin:"0 auto", display:"flex", borderTop:"1px solid #1e3a5f", width:"100%" },
  navBtn:{ flex:1, background:"none", border:"none", borderBottom:"2px solid transparent", cursor:"pointer", padding:"8px 4px", fontSize:12, fontWeight:600, transition:"color 0.2s" },
  main:{ flex:1, maxWidth:600, margin:"0 auto", width:"100%", paddingBottom:16 },
  page:{ padding:16 },
  pageHeader:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  pageTitle:{ fontSize:22, fontWeight:800, margin:0 },
  backBtn:{ background:"none", border:"none", color:"#64748b", fontSize:14, cursor:"pointer", marginBottom:12, padding:0 },
  hero:{ textAlign:"center", padding:"16px 0 12px", position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:12 },
  heroGlow:{ position:"absolute", top:10, left:"50%", transform:"translateX(-50%)", width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle, rgba(56,189,248,0.1), transparent 70%)", pointerEvents:"none" },
  heroTitle:{ fontSize:34, fontWeight:900, margin:"0", lineHeight:1.1, letterSpacing:"-1px" },
  heroAccent:{ color:"#38bdf8" },
  heroSub:{ color:"#475569", fontSize:13, marginTop:6 },
  statsRow:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, margin:"14px 0" },
  statCard:{ background:"#0a1628", borderRadius:12, padding:"13px 6px", display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", border:"1px solid transparent", outline:"none" },
  statLabel:{ fontSize:10, color:"#475569", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, textAlign:"center" },
  statHint:{ fontSize:10, color:"#1e3a5f", marginTop:1 },
  drawCard:{ background:"#04080f", border:"1px solid #1e3a5f", borderRadius:16, padding:20 },
  warn:{ background:"#451a0322", border:"1px solid #92400e44", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#fbbf24", marginBottom:10 },
  drawBtn:{ width:"100%", padding:14, background:"linear-gradient(135deg,#0ea5e9,#1d4ed8)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", letterSpacing:0.3, marginTop:8, boxShadow:"0 4px 20px rgba(14,165,233,0.2)" },
  seeResultBtn:{ display:"block", width:"100%", marginTop:10, background:"none", border:"1px solid #1e293b", borderRadius:8, color:"#64748b", padding:8, fontSize:13, cursor:"pointer" },
  clearBtn:{ width:"100%", padding:"12px", background:"none", border:"1px solid #ef444444", borderRadius:10, color:"#ef4444", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:10 },
  playerList:{ display:"flex", flexDirection:"column", gap:8 },
  playerCard:{ background:"#04080f", border:"1px solid #1e3a5f", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 },
  pcLeft:{ display:"flex", alignItems:"center", gap:12 },
  pcRight:{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 },
  avatar:{ width:44, height:44, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" },
  avatarImg:{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" },
  pName:{ fontSize:15, fontWeight:700, marginBottom:4 },
  pMeta:{ display:"flex", alignItems:"center", gap:6 },
  posTag:{ fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:20, textTransform:"uppercase", letterSpacing:0.5 },
  pAge:{ fontSize:11, color:"#64748b" },
  levelBadge:{ display:"flex", alignItems:"baseline", gap:2 },
  lvNum:{ fontSize:18, fontWeight:900, color:"#f59e0b" },
  lvStar:{ fontSize:12, color:"#f59e0b" },
  actions:{ display:"flex", gap:4 },
  iBtn:{ background:"none", border:"none", cursor:"pointer", fontSize:14, padding:4, opacity:0.8 },
  addBtn:{ background:"#0ea5e9", border:"none", borderRadius:8, color:"#fff", padding:"8px 14px", fontSize:13, fontWeight:700, cursor:"pointer" },
  empty:{ textAlign:"center", color:"#475569", padding:"40px 0", lineHeight:1.8 },
  detailCard:{ background:"#04080f", border:"1px solid #1e3a5f", borderRadius:16, padding:20 },
  detailAv:{ width:80, height:80, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" },
  detailName:{ textAlign:"center", fontSize:22, fontWeight:800, margin:"10px 0 8px" },
  detailMeta:{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap", marginBottom:12 },
  posTagLg:{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:20 },
  lvBar:{ height:6, background:"#1e293b", borderRadius:3, marginBottom:16, overflow:"hidden" },
  lvBarFill:{ height:"100%", borderRadius:3 },
  secLabel:{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 },
  chipRow:{ display:"flex", flexWrap:"wrap", gap:6, marginTop:4 },
  chip:{ background:"#1e293b", border:"1px solid #334155", borderRadius:20, padding:"4px 10px", fontSize:12, color:"#cbd5e1" },
  presLine:{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid #1e293b", fontSize:14 },
  editBtn:{ width:"100%", marginTop:14, padding:12, background:"#1e293b", border:"none", borderRadius:10, color:"#f1f5f9", fontSize:14, fontWeight:700, cursor:"pointer" },
  formCard:{ background:"#04080f", border:"1px solid #1e3a5f", borderRadius:16, padding:20, display:"flex", flexDirection:"column", gap:14 },
  photoPrev:{ width:70, height:70, borderRadius:"50%", background:"#1e293b", border:"2px dashed #1e3a5f", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" },
  inp:{ background:"#1e293b", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#f1f5f9", fontSize:14, outline:"none" },
  range:{ accentColor:"#38bdf8" },
  addCBtn:{ background:"#0ea5e9", border:"none", borderRadius:8, color:"#fff", width:40, height:40, fontSize:18, cursor:"pointer", flexShrink:0 },
  saveBtn:{ width:"100%", padding:13, background:"linear-gradient(135deg,#0ea5e9,#1d4ed8)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer" },
  // Presence
  presCount:{ background:"#16a34a22", color:"#34d399", border:"1px solid #16a34a44", borderRadius:20, padding:"4px 12px", fontSize:13, fontWeight:700 },
  presActions:{ display:"flex", flexDirection:"column", gap:8, marginTop:12 },
  presGrid:{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:4 },
  presCard:{ borderRadius:12, padding:"12px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, cursor:"pointer", transition:"all 0.2s" },
  presAv:{ width:46, height:46, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" },
  posTagSm:{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:20, textTransform:"uppercase" },
  presSummary:{ display:"flex", gap:12, marginBottom:12, fontSize:13, color:"#94a3b8", flexWrap:"wrap" },
  // Avulso
  avulsoSection:{ marginBottom:14 },
  avulsoBtn:{ width:"100%", padding:"11px", background:"#1e293b", border:"1px dashed #f59e0b66", borderRadius:10, color:"#f59e0b", fontSize:13, fontWeight:700, cursor:"pointer" },
  avulsoInputRow:{ display:"flex", gap:8, alignItems:"center" },
  avulsoList:{ marginBottom:14, background:"#0a1628", border:"1px solid #f59e0b22", borderRadius:12, padding:"10px 14px" },
  avulsoItem:{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:"1px solid #1e293b" },
  avulsoAvatar:{ width:36, height:36, borderRadius:"50%", background:"#f59e0b22", border:"2px solid #f59e0b", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  avulsoTag:{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#f59e0b22", color:"#f59e0b", border:"1px solid #f59e0b44" },
  avulsoTagSm:{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, background:"#f59e0b22", color:"#f59e0b" },
  avulsoInfo:{ background:"#451a0344", border:"1px solid #f59e0b44", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#fbbf24", marginBottom:12 },
  // Draw
  teamCard:{ background:"#04080f", borderRadius:14, overflow:"hidden", marginBottom:0 },
  teamRow:{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px" },
  teamAv:{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" },
  balanceBar:{ background:"#04080f", border:"1px solid #1e3a5f", borderRadius:10, padding:"10px 14px", display:"flex", justifyContent:"space-between", fontSize:13 },
  reshuffleBtn:{ background:"#1e293b", border:"none", borderRadius:8, color:"#f1f5f9", padding:"7px 12px", fontSize:13, fontWeight:700, cursor:"pointer" },
  bottomNav:{ position:"fixed", bottom:0, left:0, right:0, background:"#04080f", borderTop:"1px solid #1e3a5f", display:"flex", justifyContent:"space-around", padding:"8px 0 4px", zIndex:50 },
  bBtn:{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 12px", transition:"color 0.2s" },
};
