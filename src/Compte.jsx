import React, { useCallback, useEffect, useRef, useState } from "react";

const SUPABASE_URL = "https://lvvrerrzhtvmgdyzuipc.supabase.co";
const SUPABASE_KEY =
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
const STATUS_ORDER = ["en_attente", "confirmee", "en_preparation", "prete", "en_livraison", "terminee"];

const IconClose = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
    <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
  </svg>
);
export const IconUser = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
  </svg>
);
const IconStar = ({ className, filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" className={className}>
    <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6L12 3Z" />
  </svg>
);
const IconTrash = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

// Panneau lateral generique (reutilise pour le panier et le compte)
export function SidePanel({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-[#1b1109] border-l border-[#e8871e]/30 flex flex-col animate-[slideIn_.25s_ease]">
        <style>{`@keyframes slideIn { from { transform: translateX(100%);} to { transform: translateX(0);} }`}</style>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8871e]/20">
          <h3 className="font-display text-xl italic text-[#e8871e]">{title}</h3>
          <button onClick={onClose}><IconClose className="w-5 h-5 text-[#f3ead9]/70 hover:text-[#f3ead9]" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Session avec rafraichissement automatique ----------
// Le token d'acces expire au bout d'1h. On le renouvelle via le refresh_token
// avant chaque appel si besoin, pour que le panier/compte/avis restent utilisables
// meme apres une longue session de navigation.
export function withExpiry(authData) {
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
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return withExpiry(data);
}

// Hook reutilisable par ClientApp (checkout) et par Compte (profil/adresses/commandes/avis)
export function useAuthedFetch(session, setSession) {
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
      }
    }
    return s?.access_token || SUPABASE_KEY;
  }, [setSession]);

  const authFetch = useCallback(
    async (path, opts = {}) => {
      const token = await getToken();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...opts,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: opts.prefer || "return=representation",
          ...(opts.headers || {}),
        },
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.message || `Erreur ${res.status}`);
      return data;
    },
    [getToken]
  );

  const uploadAvatar = useCallback(
    async (file) => {
      const token = await getToken();
      const uid = sessionRef.current?.user?.id;
      const path = `avatars/${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error(await res.text());
      return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    },
    [getToken]
  );

  return { authFetch, uploadAvatar };
}

// ---------- Compte client ----------
// A l'inscription, nom / email / telephone sont enregistres dans la table `profiles`
// (via le trigger Supabase `on_auth_user_created`) -> utilisables pour la prospection
// et les campagnes de fidelisation depuis le dashboard admin (page "Clients").
export default function Compte({ session, setSession, onClose }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("profil");
  const { authFetch, uploadAvatar } = useAuthedFetch(session, setSession);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            data: { full_name: form.full_name, phone: form.phone },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || data.error_description || "Inscription impossible");
        setSession(withExpiry(data));
      } else {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error_description || data.msg || "Identifiants incorrects");
        setSession(withExpiry(data));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <form onSubmit={submit} className="px-5 py-5 flex-1 overflow-y-auto">
        <div className="flex gap-2 mb-5">
          <button type="button" onClick={() => setMode("login")} className={`flex-1 py-2 rounded-full text-sm border ${mode === "login" ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/30 text-[#f3ead9]/70"}`}>Connexion</button>
          <button type="button" onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-full text-sm border ${mode === "signup" ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/30 text-[#f3ead9]/70"}`}>Inscription</button>
        </div>

        {mode === "signup" && (
          <>
            <label className="text-xs text-[#f3ead9]/60">Nom complet</label>
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full mt-1 mb-3 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
            <label className="text-xs text-[#f3ead9]/60">Telephone</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212..."
              className="w-full mt-1 mb-3 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
          </>
        )}
        <label className="text-xs text-[#f3ead9]/60">Email</label>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full mt-1 mb-3 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
        <label className="text-xs text-[#f3ead9]/60">Mot de passe</label>
        <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full mt-1 mb-4 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <button disabled={loading} className="w-full bg-[#e8871e] text-[#1b1109] font-medium py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition disabled:opacity-50">
          {loading ? "Patiente..." : mode === "signup" ? "Creer mon compte" : "Se connecter"}
        </button>
        <p className="text-xs text-[#f3ead9]/40 mt-4">
          En creant un compte, tu recevras des offres et actualites de Les saveurs africaines, et tu cumuleras des points de fidelite a chaque commande.
        </p>
      </form>
    );
  }

  const TABS = [
    { key: "profil", label: "Profil" },
    { key: "adresses", label: "Adresses" },
    { key: "commandes", label: "Commandes" },
    { key: "avis", label: "Avis" },
  ];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="flex gap-1 px-5 pt-4 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${tab === t.key ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/25 text-[#f3ead9]/60"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 px-5 py-4">
        {tab === "profil" && <ProfilTab session={session} setSession={setSession} authFetch={authFetch} uploadAvatar={uploadAvatar} onClose={onClose} />}
        {tab === "adresses" && <AdressesTab session={session} authFetch={authFetch} />}
        {tab === "commandes" && <CommandesTab session={session} authFetch={authFetch} />}
        {tab === "avis" && <AvisTab session={session} authFetch={authFetch} />}
      </div>
    </div>
  );
}

// ---------- Profil ----------
function ProfilTab({ session, setSession, authFetch, uploadAvatar, onClose }) {
  const user = session.user;
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    authFetch(`profiles?id=eq.${user.id}&select=*`).then((rows) => {
      const p = rows?.[0];
      if (p) {
        setProfile(p);
        setForm({ full_name: p.full_name || "", phone: p.phone || "", avatar_url: p.avatar_url || "" });
      }
    });
  }, [authFetch, user.id]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      await authFetch(`profiles?id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify(form) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadAvatar(file);
      setForm((f) => ({ ...f, avatar_url: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await authFetch("rpc/delete_my_account", { method: "POST", body: JSON.stringify({}) });
      setSession(null);
      onClose();
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border border-[#e8871e]/40" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#e8871e]/10 border border-[#e8871e]/30 flex items-center justify-center">
              <IconUser className="w-7 h-7 text-[#e8871e]/60" />
            </div>
          )}
        </div>
        <label className="text-xs border border-[#e8871e]/30 rounded-full px-3 py-1.5 cursor-pointer hover:bg-[#e8871e]/10 transition">
          {uploading ? "Envoi..." : "Changer la photo"}
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
        </label>
      </div>

      <div className="bg-[#241609] border border-[#e8871e]/15 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-[#f3ead9]/50">Points de fidelite</p>
        <p className="font-display italic text-2xl text-[#e8871e]">{profile?.loyalty_points ?? 0}</p>
      </div>

      <label className="text-xs text-[#f3ead9]/60">Nom complet</label>
      <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        className="w-full mt-1 mb-3 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
      <label className="text-xs text-[#f3ead9]/60">Telephone</label>
      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full mt-1 mb-3 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
      <label className="text-xs text-[#f3ead9]/60">Email</label>
      <input value={user.email} disabled
        className="w-full mt-1 mb-4 bg-transparent border border-[#e8871e]/10 rounded-lg px-3 py-2 text-sm text-[#f3ead9]/40" />

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <button onClick={save} disabled={saving} className="w-full bg-[#e8871e] text-[#1b1109] font-medium py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition disabled:opacity-50">
        {saving ? "Enregistrement..." : saved ? "Enregistre ✓" : "Enregistrer"}
      </button>

      <button
        onClick={() => { setSession(null); onClose(); }}
        className="w-full mt-3 border border-[#e8871e]/40 text-sm py-2.5 rounded-full hover:bg-[#e8871e]/10 transition"
      >
        Se deconnecter
      </button>

      <div className="mt-6 pt-4 border-t border-[#e8871e]/15">
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="w-full text-xs text-red-400/80 hover:text-red-400 py-2">
            Supprimer mon compte
          </button>
        ) : (
          <div className="text-center">
            <p className="text-xs text-[#f3ead9]/60 mb-2">Cette action est definitive et supprime toutes tes donnees. Confirmer ?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-[#e8871e]/30 text-xs py-2 rounded-full">Annuler</button>
              <button onClick={deleteAccount} disabled={deleting} className="flex-1 bg-red-500/90 text-white text-xs py-2 rounded-full disabled:opacity-50">
                {deleting ? "Suppression..." : "Oui, supprimer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Adresses ----------
function AdressesTab({ session, authFetch }) {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ label: "", address: "", city: "", quartier: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    authFetch(`addresses?user_id=eq.${session.user.id}&select=*&order=created_at.desc`)
      .then((rows) => setAddresses(rows || []))
      .finally(() => setLoading(false));
  }, [authFetch, session.user.id]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!form.address.trim()) return;
    setSaving(true);
    try {
      await authFetch("addresses", { method: "POST", body: JSON.stringify({ ...form, user_id: session.user.id }) });
      setForm({ label: "", address: "", city: "", quartier: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(a) {
    await authFetch(`addresses?id=eq.${a.id}`, { method: "DELETE", prefer: "return=minimal" });
    load();
  }

  return (
    <div>
      {loading && <p className="text-xs text-[#f3ead9]/40 mb-3">Chargement...</p>}
      <div className="space-y-2 mb-5">
        {addresses.map((a) => (
          <div key={a.id} className="bg-[#241609] border border-[#e8871e]/15 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-sm">{a.label || "Adresse"}</p>
              <p className="text-xs text-[#f3ead9]/50">{a.address}{a.quartier ? `, ${a.quartier}` : ""}{a.city ? `, ${a.city}` : ""}</p>
            </div>
            <button onClick={() => remove(a)} className="p-1 hover:text-red-400"><IconTrash className="w-4 h-4" /></button>
          </div>
        ))}
        {!loading && addresses.length === 0 && <p className="text-xs text-[#f3ead9]/40">Aucune adresse enregistree.</p>}
      </div>

      <p className="text-xs text-[#f3ead9]/60 mb-2">Ajouter une adresse</p>
      <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Nom (ex: Maison, Bureau)"
        className="w-full mb-2 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
      <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresse"
        className="w-full mb-2 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
      <div className="flex gap-2 mb-3">
        <input value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} placeholder="Quartier"
          className="w-1/2 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ville"
          className="w-1/2 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
      </div>
      <button onClick={add} disabled={saving} className="w-full bg-[#e8871e] text-[#1b1109] font-medium py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition disabled:opacity-50">
        {saving ? "Ajout..." : "Ajouter l'adresse"}
      </button>
    </div>
  );
}

// ---------- Commandes (progression) ----------
function CommandesTab({ session, authFetch }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`orders?user_id=eq.${session.user.id}&select=*,order_items(*)&order=created_at.desc`)
      .then((rows) => setOrders(rows || []))
      .finally(() => setLoading(false));
  }, [authFetch, session.user.id]);

  if (loading) return <p className="text-xs text-[#f3ead9]/40">Chargement...</p>;
  if (orders.length === 0) return <p className="text-xs text-[#f3ead9]/40">Tu n'as pas encore passe de commande.</p>;

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const stepIndex = STATUS_ORDER.indexOf(o.status);
        const isCancelled = o.status === "annulee";
        return (
          <div key={o.id} className="bg-[#241609] border border-[#e8871e]/15 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">{o.order_number}</p>
              <span className="font-mono-price text-sm text-[#e8871e]">{Number(o.total).toFixed(0)} dh</span>
            </div>
            {isCancelled ? (
              <p className="text-xs text-red-400">Commande annulee</p>
            ) : (
              <div className="flex items-center gap-1 mb-2">
                {STATUS_ORDER.map((s, i) => (
                  <div key={s} className="flex-1 flex items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${i <= stepIndex ? "bg-[#e8871e]" : "bg-[#f3ead9]/15"}`} />
                    {i < STATUS_ORDER.length - 1 && <div className={`flex-1 h-0.5 ${i < stepIndex ? "bg-[#e8871e]" : "bg-[#f3ead9]/15"}`} />}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-[#f3ead9]/60">{STATUS_LABELS[o.status]}</p>
            <p className="text-xs text-[#f3ead9]/40 mt-2">
              {(o.order_items || []).map((it) => `${it.product_name} x${it.quantity}`).join(", ")}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Avis ----------
function AvisTab({ session, authFetch }) {
  const [myReviews, setMyReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    authFetch(`reviews?user_id=eq.${session.user.id}&select=*&order=created_at.desc`)
      .then((rows) => setMyReviews(rows || []))
      .finally(() => setLoading(false));
  }, [authFetch, session.user.id]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await authFetch("reviews", { method: "POST", body: JSON.stringify({ user_id: session.user.id, rating, comment }) });
      setComment("");
      setRating(5);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(r) {
    await authFetch(`reviews?id=eq.${r.id}`, { method: "DELETE", prefer: "return=minimal" });
    load();
  }

  return (
    <div>
      <p className="text-xs text-[#f3ead9]/60 mb-2">Laisser un avis</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)}>
            <IconStar className={`w-6 h-6 ${n <= rating ? "text-[#e8871e]" : "text-[#f3ead9]/20"}`} filled={n <= rating} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Ton experience chez nous..."
        className="w-full mb-3 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />
      <button onClick={submit} disabled={saving} className="w-full bg-[#e8871e] text-[#1b1109] font-medium py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition disabled:opacity-50 mb-6">
        {saving ? "Envoi..." : "Publier l'avis"}
      </button>

      <p className="text-xs text-[#f3ead9]/60 mb-2">Mes avis</p>
      {loading && <p className="text-xs text-[#f3ead9]/40">Chargement...</p>}
      <div className="space-y-2">
        {myReviews.map((r) => (
          <div key={r.id} className="bg-[#241609] border border-[#e8871e]/15 rounded-xl px-3 py-2.5 flex items-start justify-between gap-2">
            <div>
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((n) => <IconStar key={n} className={`w-3 h-3 ${n <= r.rating ? "text-[#e8871e]" : "text-[#f3ead9]/20"}`} filled={n <= r.rating} />)}
              </div>
              <p className="text-xs text-[#f3ead9]/70">{r.comment}</p>
            </div>
            <button onClick={() => remove(r)} className="p-1 hover:text-red-400 shrink-0"><IconTrash className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {!loading && myReviews.length === 0 && <p className="text-xs text-[#f3ead9]/40">Tu n'as pas encore laisse d'avis.</p>}
      </div>
    </div>
  );
}