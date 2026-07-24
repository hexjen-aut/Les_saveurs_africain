import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

const SUPABASE_URL = "https://lvvrerrzhtvmgdyzuipc.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnJlcnJ6aHR2bWdkeXp1aXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1ODExNzAsImV4cCI6MjEwMDE1NzE3MH0.yv6kDwV0oV-0OwGJbzgwgg72OR8oi5SEZrw74gOB4zo";

const BUCKET = "site-assets";

const STATUS_LABELS = {
  en_attente: "En attente",
  confirmee: "Confirmee",
  en_preparation: "En preparation",
  prete: "Prete",
  en_livraison: "En livraison",
  terminee: "Terminee",
  annulee: "Annulee",
};
const STATUS_ORDER = ["en_attente", "confirmee", "en_preparation", "prete", "en_livraison", "terminee", "annulee"];

function formatDh(n) {
  return `${Number(n || 0).toFixed(0)} dh`;
}

// ---------- Icones traits fins ----------
const Icon = {
  Dashboard: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  Box: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>,
  Tag: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M20 12l-8 8-9-9V3h8l9 9Z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>,
  Receipt: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 8h6M9 12h6"/></svg>,
  Users: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/><circle cx="17" cy="8" r="2.5"/><path d="M23 20c0-2.5-2-4.2-5-4.7"/></svg>,
  Settings: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2L10 21h4l.6-2.6c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>,
  Plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  Trash: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>,
  Close: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M5 5l14 14M19 5L5 19"/></svg>,
  Edit: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>,
  LogOut: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>,
  Upload: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>,
  Download: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>,
  Star: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}><path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6L12 3Z"/></svg>,
};

// ---------- Session avec rafraichissement automatique ----------
// Le token expirait au bout d'1h sans jamais etre renouvele : c'etait la cause du bug
// "l'upload de photo produit ne marche plus" apres un moment passe sur le dashboard
// (les appels a l'API Supabase se mettaient a echouer silencieusement avec un token perime).
function withExpiry(authData) {
  return { ...authData, obtained_at: Date.now() };
}
function isExpiredOrSoon(session) {
  if (!session) return true;
  const ttlMs = (session.expires_in || 3600) * 1000;
  return Date.now() - session.obtained_at > ttlMs - 60000;
}
async function refreshSessionToken(session) {
  if (!session?.refresh_token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return withExpiry(data);
}

// ---------- API helpers ----------
function useSupabase(session, setSession) {
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const getToken = useCallback(async () => {
    let s = sessionRef.current;
    if (s && isExpiredOrSoon(s)) {
      const refreshed = await refreshSessionToken(s);
      if (refreshed) {
        setSession(refreshed);
        sessionRef.current = refreshed;
        s = refreshed;
      } else {
        // refresh token invalide/expire -> on force une reconnexion propre plutot
        // que de laisser des appels echouer en silence
        setSession(null);
        return null;
      }
    }
    return s?.access_token || null;
  }, [setSession]);

  const rest = useCallback(
    async (path, opts = {}) => {
      const token = await getToken();
      if (!token) throw new Error("Session expiree, merci de te reconnecter.");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...opts,
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: opts.prefer || "return=representation",
          ...(opts.headers || {}),
        },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Erreur ${res.status}`);
      }
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    },
    [getToken]
  );

  const uploadFile = useCallback(
    async (file, folder) => {
      const token = await getToken();
      if (!token) throw new Error("Session expiree, merci de te reconnecter.");
      const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method: "POST",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: file,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Echec de l'upload");
      }
      return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    },
    [getToken]
  );

  return { rest, uploadFile };
}

// ---------- Auth ----------
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || "Identifiants incorrects");
      onLogin(withExpiry(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1b1109] text-[#f3ead9] flex items-center justify-center px-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500&family=Work+Sans:wght@400;500;600&family=DM+Mono:wght@500&display=swap');
        .font-display{font-family:'Fraunces',serif} .font-mono-price{font-family:'DM Mono',monospace}`}</style>
      <form onSubmit={submit} className="w-full max-w-sm bg-[#241609] border border-[#e8871e]/20 rounded-2xl p-8">
        <p className="font-display italic text-2xl text-[#e8871e] mb-1">Les saveurs africaines</p>
        <p className="text-sm text-[#f3ead9]/50 mb-6">Espace administrateur</p>
        <label className="text-xs text-[#f3ead9]/60">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
          className="w-full mt-1 mb-4 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
        <label className="text-xs text-[#f3ead9]/60">Mot de passe</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
          className="w-full mt-1 mb-4 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <button disabled={loading} className="w-full bg-[#e8871e] text-[#1b1109] font-medium py-2.5 rounded-lg text-sm hover:bg-[#f0983a] transition disabled:opacity-50">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

// ---------- Layout ----------
const NAV = [
  { key: "dashboard", label: "Tableau de bord", icon: Icon.Dashboard },
  { key: "produits", label: "Produits", icon: Icon.Box },
  { key: "categories", label: "Categories", icon: Icon.Tag },
  { key: "commandes", label: "Commandes", icon: Icon.Receipt },
  { key: "clients", label: "Clients", icon: Icon.Users },
  { key: "avis", label: "Avis", icon: Icon.Star },
  { key: "parametres", label: "Parametres", icon: Icon.Settings },
];

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("dashboard");
  const { rest, uploadFile } = useSupabase(session, setSession);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cats, prods, ords, sett, profs, revs] = await Promise.all([
        rest("categories?select=*&order=display_order.asc"),
        rest("products?select=*&order=display_order.asc"),
        rest("orders?select=*,order_items(*)&order=created_at.desc&limit=100"),
        rest("settings?select=*&id=eq.1"),
        rest("profiles?select=*&order=created_at.desc"),
        rest("reviews?select=*,profiles(full_name),products(name)&order=created_at.desc&limit=100"),
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      setOrders(ords || []);
      setSettings((sett && sett[0]) || null);
      setClients(profs || []);
      setReviews(revs || []);
    } catch (e) {
      console.error(e);
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rest]);

  useEffect(() => {
    if (session) loadAll();
  }, [session, loadAll]);

  if (!session) return <LoginScreen onLogin={setSession} />;

  const todayStr = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter((o) => (o.created_at || "").slice(0, 10) === todayStr);
  const revenueToday = ordersToday.reduce((s, o) => s + Number(o.total || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "en_attente").length;

  return (
    <div className="min-h-screen bg-[#15100a] text-[#f3ead9] flex" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500&family=Work+Sans:wght@400;500;600&family=DM+Mono:wght@500&display=swap');
        .font-display{font-family:'Fraunces',serif} .font-mono-price{font-family:'DM Mono',monospace}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:#6b4425;border-radius:4px}`}</style>

      {/* SIDEBAR */}
      <aside className="w-56 shrink-0 bg-[#1b1109] border-r border-[#e8871e]/15 flex flex-col">
        <div className="px-5 py-5 border-b border-[#e8871e]/15 flex items-center gap-2">
          {settings?.logo_url && <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover" />}
          <div>
            <p className="font-display italic text-lg text-[#e8871e] leading-tight">Les saveurs</p>
            <p className="font-display italic text-lg text-[#f3ead9] leading-tight">africaines</p>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setPage(n.key)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition ${
                page === n.key ? "bg-[#e8871e]/15 text-[#e8871e] border-r-2 border-[#e8871e]" : "text-[#f3ead9]/70 hover:bg-[#e8871e]/5"
              }`}
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setSession(null)}
          className="flex items-center gap-3 px-5 py-4 text-sm text-[#f3ead9]/50 hover:text-[#f3ead9] border-t border-[#e8871e]/15"
        >
          <Icon.LogOut className="w-4 h-4" />
          Deconnexion
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="px-8 py-6 max-w-6xl">
          {loading && <p className="text-sm text-[#f3ead9]/40 mb-4">Chargement...</p>}
          {loadError && (
            <div className="mb-4 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 flex items-center justify-between">
              <span>{loadError}</span>
              {loadError.includes("expiree") && (
                <button onClick={() => setSession(null)} className="underline shrink-0 ml-3">Se reconnecter</button>
              )}
            </div>
          )}

          {page === "dashboard" && (
            <DashboardPage orders={orders} ordersToday={ordersToday} revenueToday={revenueToday} pendingCount={pendingCount} products={products} clients={clients} reviews={reviews} />
          )}
          {page === "produits" && (
            <ProductsPage products={products} categories={categories} rest={rest} uploadFile={uploadFile} reload={loadAll} />
          )}
          {page === "categories" && <CategoriesPage categories={categories} rest={rest} reload={loadAll} />}
          {page === "commandes" && <OrdersPage orders={orders} rest={rest} reload={loadAll} />}
          {page === "clients" && <ClientsPage clients={clients} />}
          {page === "avis" && <ReviewsPage reviews={reviews} rest={rest} reload={loadAll} />}
          {page === "parametres" && <SettingsPage settings={settings} rest={rest} uploadFile={uploadFile} reload={loadAll} />}
        </div>
      </main>
    </div>
  );
}

// ---------- Dashboard ----------
function Card({ label, value, accent }) {
  return (
    <div className="bg-[#241609] border border-[#e8871e]/15 rounded-2xl p-5">
      <p className="text-xs text-[#f3ead9]/50 mb-2">{label}</p>
      <p className={`font-mono-price text-2xl ${accent ? "text-[#e8871e]" : "text-[#f3ead9]"}`}>{value}</p>
    </div>
  );
}

function DashboardPage({ orders, ordersToday, revenueToday, pendingCount, products, clients, reviews }) {
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "-";
  return (
    <div>
      <h1 className="font-display text-3xl italic mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card label="Commandes aujourd'hui" value={ordersToday.length} />
        <Card label="Revenus aujourd'hui" value={formatDh(revenueToday)} accent />
        <Card label="Commandes en attente" value={pendingCount} accent />
        <Card label="Produits actifs" value={products.filter((p) => p.is_available).length} />
        <Card label="Clients inscrits" value={clients.length} />
        <Card label="Note moyenne" value={avgRating === "-" ? "-" : `${avgRating}/5`} />
      </div>
      <h2 className="font-display text-xl italic mb-3">Dernieres commandes</h2>
      <div className="bg-[#241609] border border-[#e8871e]/15 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#f3ead9]/50 border-b border-[#e8871e]/15">
              <th className="px-4 py-3 font-normal">N°</th>
              <th className="px-4 py-3 font-normal">Statut</th>
              <th className="px-4 py-3 font-normal">Total</th>
              <th className="px-4 py-3 font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 8).map((o) => (
              <tr key={o.id} className="border-b border-[#e8871e]/5 last:border-0">
                <td className="px-4 py-3">{o.order_number}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-[#e8871e]/15 text-[#e8871e]">{STATUS_LABELS[o.status]}</span>
                </td>
                <td className="px-4 py-3 font-mono-price">{formatDh(o.total)}</td>
                <td className="px-4 py-3 text-[#f3ead9]/50">{new Date(o.created_at).toLocaleString("fr-FR")}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-[#f3ead9]/40">Aucune commande pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Composant upload image reutilisable ----------
function ImageUploadField({ label, value, onChange, uploadFile, folder }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadFile(file, folder);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="text-xs text-[#f3ead9]/60 block mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="w-14 h-14 rounded-lg object-cover border border-[#e8871e]/30" />
        ) : (
          <div className="w-14 h-14 rounded-lg border border-dashed border-[#e8871e]/30 flex items-center justify-center text-[#f3ead9]/30">
            <Icon.Upload className="w-5 h-5" />
          </div>
        )}
        <label className="flex items-center gap-2 text-xs border border-[#e8871e]/30 rounded-full px-3 py-1.5 cursor-pointer hover:bg-[#e8871e]/10 transition">
          <Icon.Upload className="w-3.5 h-3.5" />
          {uploading ? "Envoi..." : "Choisir une image"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ---------- Produits ----------
function ProductsPage({ products, categories, rest, uploadFile, reload }) {
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [busy, setBusy] = useState(false);

  const filtered = filterCat === "all" ? products : products.filter((p) => p.category_id === filterCat);

  async function toggleAvailable(p) {
    await rest(`products?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ is_available: !p.is_available }) });
    reload();
  }

  async function remove(p) {
    if (!confirm(`Supprimer "${p.name}" ?`)) return;
    setBusy(true);
    await rest(`products?id=eq.${p.id}`, { method: "DELETE", prefer: "return=minimal" });
    setBusy(false);
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl italic">Produits</h1>
        <button onClick={() => setEditing("new")} className="flex items-center gap-2 bg-[#e8871e] text-[#1b1109] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#f0983a] transition">
          <Icon.Plus className="w-4 h-4" /> Nouveau produit
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        <button onClick={() => setFilterCat("all")} className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap ${filterCat === "all" ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/30 text-[#f3ead9]/70"}`}>Toutes</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap ${filterCat === c.id ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/30 text-[#f3ead9]/70"}`}>{c.name}</button>
        ))}
      </div>

      <div className="bg-[#241609] border border-[#e8871e]/15 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#f3ead9]/50 border-b border-[#e8871e]/15">
              <th className="px-4 py-3 font-normal">Image</th>
              <th className="px-4 py-3 font-normal">Nom</th>
              <th className="px-4 py-3 font-normal">Categorie</th>
              <th className="px-4 py-3 font-normal">Prix</th>
              <th className="px-4 py-3 font-normal">Disponible</th>
              <th className="px-4 py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-[#e8871e]/5 last:border-0">
                <td className="px-4 py-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#e8871e]/10" />
                  )}
                </td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-[#f3ead9]/60">{categories.find((c) => c.id === p.category_id)?.name || "-"}</td>
                <td className="px-4 py-3 font-mono-price text-[#e8871e]">{formatDh(p.price)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAvailable(p)} className={`w-9 h-5 rounded-full relative transition ${p.is_available ? "bg-[#e8871e]" : "bg-[#f3ead9]/15"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#1b1109] transition ${p.is_available ? "left-4" : "left-0.5"}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(p)} className="p-1.5 hover:text-[#e8871e]"><Icon.Edit className="w-4 h-4" /></button>
                  <button onClick={() => remove(p)} disabled={busy} className="p-1.5 hover:text-red-400"><Icon.Trash className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-[#f3ead9]/40">Aucun produit.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductModal
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
          rest={rest}
          uploadFile={uploadFile}
        />
      )}
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSaved, rest, uploadFile }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    category_id: product?.category_id || categories[0]?.id || "",
    price: product?.price ?? 0,
    description: product?.description || "",
    prep_time_minutes: product?.prep_time_minutes || "",
    is_available: product?.is_available ?? true,
    is_popular: product?.is_popular ?? false,
    is_new: product?.is_new ?? false,
    image_url: product?.image_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, price: Number(form.price), prep_time_minutes: form.prep_time_minutes ? Number(form.prep_time_minutes) : null };
      if (product) {
        await rest(`products?id=eq.${product.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await rest("products", { method: "POST", body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1b1109] border border-[#e8871e]/25 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl italic text-[#e8871e]">{product ? "Modifier le produit" : "Nouveau produit"}</h3>
          <button onClick={onClose}><Icon.Close className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <ImageUploadField
            label="Photo du produit"
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            uploadFile={uploadFile}
            folder="produits"
          />
          <Field label="Nom">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </Field>
          <Field label="Categorie">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Prix (dh)">
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
          </Field>
          <Field label="Temps de preparation (min)">
            <input type="number" value={form.prep_time_minutes} onChange={(e) => setForm({ ...form, prep_time_minutes: e.target.value })} className="input" />
          </Field>
          <div className="flex gap-4 pt-1">
            <Toggle label="Disponible" checked={form.is_available} onChange={(v) => setForm({ ...form, is_available: v })} />
            <Toggle label="Populaire" checked={form.is_popular} onChange={(v) => setForm({ ...form, is_popular: v })} />
            <Toggle label="Nouveau" checked={form.is_new} onChange={(v) => setForm({ ...form, is_new: v })} />
          </div>
        </div>
        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
        <button onClick={save} disabled={saving || !form.name} className="w-full mt-5 bg-[#e8871e] text-[#1b1109] font-medium py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition disabled:opacity-50">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        <style>{`.input{width:100%;background:transparent;border:1px solid rgba(232,135,30,.3);border-radius:8px;padding:8px 12px;font-size:14px;color:#f3ead9}.input:focus{outline:none;border-color:#e8871e}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-[#f3ead9]/60 block mb-1">{label}</label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2 text-xs text-[#f3ead9]/70">
      <span className={`w-8 rounded-full relative transition ${checked ? "bg-[#e8871e]" : "bg-[#f3ead9]/15"}`} style={{ height: 18 }}>
        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-[#1b1109] transition ${checked ? "left-4" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

// ---------- Categories ----------
function CategoriesPage({ categories, rest, reload }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addCategory() {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await rest("categories", { method: "POST", body: JSON.stringify({ name, slug, display_order: categories.length + 1 }) });
      setName("");
      reload();
    } catch (e) {
      setError(e.message.includes("duplicate") ? "Une categorie avec un nom similaire existe deja." : e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(c) {
    if (!confirm(`Supprimer la categorie "${c.name}" ? Les produits associes perdront leur categorie.`)) return;
    setError("");
    try {
      await rest(`categories?id=eq.${c.id}`, { method: "DELETE", prefer: "return=minimal" });
      reload();
    } catch (e) {
      setError(e.message);
    }
  }

// ---------- Commandes ----------
function OrdersPage({ orders, rest, reload }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  async function updateStatus(o, status) {
    await rest(`orders?id=eq.${o.id}`, { method: "PATCH", body: JSON.stringify({ status, updated_at: new Date().toISOString() }) });
    reload();
  }

  return (
    <div>
      <h1 className="font-display text-3xl italic mb-6">Commandes</h1>
      <div className="flex gap-2 mb-5 overflow-x-auto">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap ${filter === "all" ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/30 text-[#f3ead9]/70"}`}>Toutes</button>
        {STATUS_ORDER.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs border whitespace-nowrap ${filter === s ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/30 text-[#f3ead9]/70"}`}>{STATUS_LABELS[s]}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="bg-[#241609] border border-[#e8871e]/15 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Commande {o.order_number} <span className="text-[#f3ead9]/40 font-normal">· {o.order_type === "emporter" ? "A emporter" : "Livraison"}</span></p>
                <p className="text-xs text-[#f3ead9]/40">{new Date(o.created_at).toLocaleString("fr-FR")} · {o.phone || "sans telephone"}</p>
              </div>
              <span className="font-mono-price text-[#e8871e]">{formatDh(o.total)}</span>
            </div>
            <div className="text-xs text-[#f3ead9]/60 mb-3">
              {(o.order_items || []).map((it) => `${it.product_name} x${it.quantity}`).join(", ") || "Details indisponibles"}
            </div>
            {o.notes && <p className="text-xs text-[#f3ead9]/40 mb-3">Note : {o.notes}</p>}
            <div className="flex gap-1.5 overflow-x-auto">
              {STATUS_ORDER.map((s) => (
                <button key={s} onClick={() => updateStatus(o, s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap border transition ${
                    o.status === s ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/20 text-[#f3ead9]/50 hover:border-[#e8871e]/50"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-[#f3ead9]/40">Aucune commande.</p>}
      </div>
    </div>
  );
}

// ---------- Clients (prospection / fidelisation) ----------
function ClientsPage({ clients }) {
  const [query, setQuery] = useState("");

  const filtered = clients.filter((c) => {
    const q = query.toLowerCase();
    return (
      !q ||
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  });

  function exportCsv() {
    const rows = [["Nom", "Email", "Telephone", "Points fidelite", "Inscrit le"]];
    filtered.forEach((c) => {
      rows.push([c.full_name || "", c.email || "", c.phone || "", c.loyalty_points || 0, new Date(c.created_at).toLocaleDateString("fr-FR")]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-les-saveurs-africaines-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl italic">Clients</h1>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-[#e8871e] text-[#1b1109] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#f0983a] transition">
          <Icon.Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par nom, email ou telephone..."
        className="w-full sm:w-80 bg-transparent border border-[#e8871e]/30 rounded-full px-4 py-2 text-sm mb-5 focus:outline-none focus:border-[#e8871e]"
      />
      <div className="bg-[#241609] border border-[#e8871e]/15 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#f3ead9]/50 border-b border-[#e8871e]/15">
              <th className="px-4 py-3 font-normal">Nom</th>
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Telephone</th>
              <th className="px-4 py-3 font-normal">Points fidelite</th>
              <th className="px-4 py-3 font-normal">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-[#e8871e]/5 last:border-0">
                <td className="px-4 py-3">{c.full_name || "-"}</td>
                <td className="px-4 py-3 text-[#f3ead9]/70">{c.email || "-"}</td>
                <td className="px-4 py-3 font-mono-price text-[#e8871e]">{c.phone || "-"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-[#e8871e]/15 text-[#e8871e] font-mono-price">{c.loyalty_points || 0} pts</span>
                </td>
                <td className="px-4 py-3 text-[#f3ead9]/50">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-[#f3ead9]/40">Aucun client pour le moment.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#f3ead9]/40 mt-3">
        {filtered.length} client{filtered.length > 1 ? "s" : ""} — utilisable pour tes campagnes WhatsApp / email de fidelisation.
      </p>
    </div>
  );
}

// ---------- Avis clients (moderation) ----------
function ReviewsPage({ reviews, rest, reload }) {
  const [busy, setBusy] = useState(false);

  async function remove(r) {
    if (!confirm("Supprimer cet avis ?")) return;
    setBusy(true);
    await rest(`reviews?id=eq.${r.id}`, { method: "DELETE", prefer: "return=minimal" });
    setBusy(false);
    reload();
  }

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "-";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl italic">Avis clients</h1>
        <div className="text-sm text-[#f3ead9]/60">Note moyenne : <span className="text-[#e8871e] font-mono-price">{avg}/5</span> ({reviews.length} avis)</div>
      </div>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-[#241609] border border-[#e8871e]/15 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-medium">{r.profiles?.full_name || "Client"}{r.products?.name ? ` · ${r.products.name}` : ""}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Icon.Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "text-[#e8871e] fill-current" : "text-[#f3ead9]/15"}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => remove(r)} disabled={busy} className="p-1.5 hover:text-red-400"><Icon.Trash className="w-4 h-4" /></button>
            </div>
            {r.comment && <p className="text-sm text-[#f3ead9]/70 mt-2">{r.comment}</p>}
            <p className="text-xs text-[#f3ead9]/30 mt-2">{new Date(r.created_at).toLocaleString("fr-FR")}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-[#f3ead9]/40">Aucun avis pour le moment.</p>}
      </div>
    </div>
  );
}

// ---------- Parametres ----------
function SettingsPage({ settings, rest, uploadFile, reload }) {
  const [form, setForm] = useState({
    restaurant_name: settings?.restaurant_name || "",
    phone: settings?.phone || "",
    whatsapp: settings?.whatsapp || "",
    tiktok: settings?.tiktok || "",
    address: settings?.address || "",
    delivery_fee: settings?.delivery_fee || 0,
    min_order_amount: settings?.min_order_amount || 0,
    points_per_order: settings?.points_per_order ?? 10,
    logo_url: settings?.logo_url || "",
    hero_image_url: settings?.hero_image_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        restaurant_name: settings.restaurant_name || "",
        phone: settings.phone || "",
        whatsapp: settings.whatsapp || "",
        tiktok: settings.tiktok || "",
        address: settings.address || "",
        delivery_fee: settings.delivery_fee || 0,
        min_order_amount: settings.min_order_amount || 0,
        points_per_order: settings.points_per_order ?? 10,
        logo_url: settings.logo_url || "",
        hero_image_url: settings.hero_image_url || "",
      });
    }
  }, [settings]);

  async function save() {
    setSaving(true);
    await rest("settings?id=eq.1", { method: "PATCH", body: JSON.stringify({ ...form, points_per_order: Number(form.points_per_order) }) });
    setSaving(false);
    setSaved(true);
    reload();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-3xl italic mb-6">Parametres</h1>
      <div className="space-y-4">
        <ImageUploadField label="Logo" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} uploadFile={uploadFile} folder="logo" />
        <ImageUploadField label="Image d'accueil (hero)" value={form.hero_image_url} onChange={(url) => setForm({ ...form, hero_image_url: url })} uploadFile={uploadFile} folder="hero" />
        <Field label="Nom du restaurant"><input className="input2" value={form.restaurant_name} onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })} /></Field>
        <Field label="Telephone"><input className="input2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="WhatsApp (support / livraison)"><input className="input2" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
        <Field label="TikTok"><input className="input2" value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} /></Field>
        <Field label="Adresse"><input className="input2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="Frais de livraison (dh)"><input type="number" className="input2" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} /></Field>
        <Field label="Montant minimum de commande (dh)"><input type="number" className="input2" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} /></Field>
        <Field label="Points de fidelite par commande terminee"><input type="number" className="input2" value={form.points_per_order} onChange={(e) => setForm({ ...form, points_per_order: e.target.value })} /></Field>
      </div>
      <button onClick={save} disabled={saving} className="mt-5 bg-[#e8871e] text-[#1b1109] font-medium px-6 py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition disabled:opacity-50">
        {saving ? "Enregistrement..." : saved ? "Enregistre ✓" : "Enregistrer"}
      </button>
      <p className="text-xs text-[#f3ead9]/40 mt-3">
        Les points sont attribues automatiquement des qu'une commande passe au statut "Terminee" (une commande = ces points, peu importe le nombre de plats a l'interieur).
      </p>
      <style>{`.input2{width:100%;background:transparent;border:1px solid rgba(232,135,30,.3);border-radius:8px;padding:8px 12px;font-size:14px;color:#f3ead9}.input2:focus{outline:none;border-color:#e8871e}`}</style>
    </div>
  );
}