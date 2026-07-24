import React, { useEffect, useMemo, useRef, useState } from "react";
import Compte, { SidePanel, IconUser, useAuthedFetch } from "./components/Compte.jsx";

const SUPABASE_URL = "https://lvvrerrzhtvmgdyzuipc.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnJlcnJ6aHR2bWdkeXp1aXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1ODExNzAsImV4cCI6MjEwMDE1NzE3MH0.yv6kDwV0oV-0OwGJbzgwgg72OR8oi5SEZrw74gOB4zo";

// Images libres de droit (Pexels) — utilisees tant que l'admin n'a pas uploade ses propres photos
const CATEGORY_IMAGES = {
  "nos-sauces":
    "https://images.pexels.com/photos/34636461/pexels-photo-34636461.jpeg?auto=compress&cs=tinysrgb&w=900",
  "nos-grillades":
    "https://images.pexels.com/photos/30788246/pexels-photo-30788246.jpeg?auto=compress&cs=tinysrgb&w=900",
  "nos-bouillons":
    "https://images.pexels.com/photos/3559899/pexels-photo-3559899.jpeg?auto=compress&cs=tinysrgb&w=900",
  "nos-salades":
    "https://images.pexels.com/photos/7245482/pexels-photo-7245482.jpeg?auto=compress&cs=tinysrgb&w=900",
  accompagnement:
    "https://images.pexels.com/photos/17952748/pexels-photo-17952748.jpeg?auto=compress&cs=tinysrgb&w=900",
};

const DEFAULT_HERO_IMAGE =
  "https://images.pexels.com/photos/31120524/pexels-photo-31120524.jpeg?auto=compress&cs=tinysrgb&w=1600";

function formatDh(n) {
  return `${Number(n).toFixed(0)} dh`;
}

const IconCart = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
    <path d="M3 4h2l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="20.5" r="1" />
    <circle cx="17" cy="20.5" r="1" />
  </svg>
);
const IconPlus = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);
const IconMinus = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
    <path d="M5 12h14" strokeLinecap="round" />
  </svg>
);
const IconWhatsapp = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.83.49 3.55 1.35 5.03L2 22l5.2-1.43a9.9 9.9 0 0 0 4.84 1.24h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.02h-.01a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.09.85.83-3-.2-.31a8.07 8.07 0 0 1-1.24-4.34c0-4.47 3.65-8.11 8.15-8.11 4.5 0 8.15 3.64 8.15 8.11 0 4.47-3.66 8.11-8.16 8.11Zm4.47-6.07c-.25-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.28.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.24-.02-.38.11-.5.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14 0-.31-.02-.47-.02-.16 0-.42.06-.65.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.35.99 2.51.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28Z" />
  </svg>
);
const IconStar = ({ className, filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" className={className}>
    <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6L12 3Z" />
  </svg>
);

// --- Reveal au scroll : simple fade + slide-up via IntersectionObserver ---
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// --- API Supabase publique (lecture, sans auth) ---
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Erreur ${res.status}`);
  return data;
}

export default function App() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [session, setSession] = useState(null); // { access_token, refresh_token, expires_in, obtained_at, user }
  const { authFetch } = useAuthedFetch(session, setSession);

  useEffect(() => {
    async function load() {
      try {
        const [cats, prods, sett, revs] = await Promise.all([
          sbFetch("categories?select=*&order=display_order.asc"),
          sbFetch("products?select=*&is_available=eq.true&order=display_order.asc"),
          sbFetch("settings?select=*&id=eq.1"),
          sbFetch("reviews?select=*&order=created_at.desc&limit=12"),
        ]);
        setCategories(cats || []);
        setProducts(prods || []);
        setSettings((sett && sett[0]) || null);
        setReviews(revs || []);
        if (cats && cats.length) setActiveCat(cats[0].slug);
      } catch (e) {
        console.error("Erreur de chargement", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const productsByCat = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.slug] = [];
    for (const p of products) {
      const cat = categories.find((c) => c.id === p.category_id);
      if (cat) map[cat.slug].push(p);
    }
    return map;
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, products]);

  const cartItems = useMemo(() => Object.values(cart).filter((i) => i.qty > 0), [cart]);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev[product.id];
      const qty = existing ? existing.qty + 1 : 1;
      return { ...prev, [product.id]: { id: product.id, name: product.name, price: product.price, qty } };
    });
  }
  function decFromCart(product) {
    setCart((prev) => {
      const existing = prev[product.id];
      if (!existing) return prev;
      return { ...prev, [product.id]: { ...existing, qty: existing.qty - 1 } };
    });
  }

  function scrollToCat(slug) {
    setActiveCat(slug);
    setQuery("");
    const el = document.getElementById(`cat-${slug}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const heroImage = settings?.hero_image_url || DEFAULT_HERO_IMAGE;
  const whatsappSupport = settings?.whatsapp?.replace(/\D/g, "");
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-[#1b1109] text-[#f3ead9]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=Work+Sans:wght@400;500;600&family=DM+Mono:wght@500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-price { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #6b4425; border-radius: 4px; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#1b1109]/95 backdrop-blur border-b border-[#e8871e]/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-8 w-8 rounded-full object-cover border border-[#e8871e]/40" />
            ) : null}
            <span className="font-display text-xl tracking-wide text-[#f3ead9]">
              Les saveurs <span className="text-[#e8871e] italic">africaines</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAccountOpen(true)}
              className="flex items-center gap-1.5 border border-[#e8871e]/50 rounded-full px-3 py-1.5 text-sm hover:bg-[#e8871e]/10 transition"
            >
              <IconUser className="w-4 h-4 text-[#e8871e]" />
              <span className="hidden sm:inline">{session ? "Mon compte" : "Connexion"}</span>
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 border border-[#e8871e]/50 rounded-full px-3 py-1.5 text-sm hover:bg-[#e8871e]/10 transition"
            >
              <IconCart className="w-4 h-4 text-[#e8871e]" />
              <span className="font-mono-price">{formatDh(cartTotal)}</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#e8871e] text-[#1b1109] text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden">
          <img src={heroImage} alt="Grillades africaines" className="absolute inset-0 w-full h-full object-cover scale-105" style={{ animation: "heroZoom 18s ease-in-out infinite alternate" }} />
          <style>{`@keyframes heroZoom { from { transform: scale(1.05);} to { transform: scale(1.15);} }`}</style>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b1109] via-[#1b1109]/60 to-[#1b1109]/20" />
          <div className="relative z-10 max-w-6xl mx-auto h-full flex flex-col justify-end px-4 pb-10">
            <Reveal>
              <div className="w-14 h-[2px] bg-[#e8871e] mb-4" />
              <h1 className="font-display text-5xl sm:text-6xl leading-[0.95] text-[#f3ead9]">
                Les saveurs
                <br />
                <span className="italic text-[#e8871e]">africaines</span>
              </h1>
              <p className="mt-4 max-w-md text-[#f3ead9]/80 text-sm sm:text-base">
                Sauces mijotées, grillades braisées et bouillons traditionnels — la cuisine d'Afrique, servie a Casablanca.
              </p>
              {avgRating && (
                <div className="mt-3 flex items-center gap-1.5 text-sm text-[#f3ead9]/70">
                  <IconStar className="w-4 h-4 text-[#e8871e]" filled />
                  <span>{avgRating}/5 · {reviews.length} avis</span>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => scrollToCat(categories[0]?.slug)}
                  className="bg-[#e8871e] text-[#1b1109] font-medium px-6 py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition"
                >
                  Voir le menu
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* RECHERCHE + CATEGORIES */}
      <div className="sticky top-[57px] z-30 bg-[#1b1109]/95 backdrop-blur border-b border-[#e8871e]/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un plat..."
            className="bg-transparent border border-[#e8871e]/30 rounded-full px-4 py-2 text-sm w-full sm:w-64 placeholder-[#f3ead9]/40 focus:outline-none focus:border-[#e8871e]"
          />
          {!query && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => scrollToCat(c.slug)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm border transition ${
                    activeCat === c.slug
                      ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]"
                      : "border-[#e8871e]/30 text-[#f3ead9]/80 hover:border-[#e8871e]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENU MENU */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading && <p className="text-[#f3ead9]/60 text-sm">Chargement du menu…</p>}

        {!loading && filteredProducts && (
          <div>
            <h2 className="font-display text-2xl italic text-[#e8871e] mb-4">Resultats pour "{query}"</h2>
            <ProductGrid products={filteredProducts} cart={cart} onAdd={addToCart} onDec={decFromCart} categories={categories} />
          </div>
        )}

        {!loading &&
          !filteredProducts &&
          categories.map((c, idx) => (
            <section id={`cat-${c.slug}`} key={c.id} className="mb-14 scroll-mt-32">
              <Reveal delay={idx * 40}>
                <div className="flex items-baseline gap-4 mb-5">
                  <h2 className="font-display text-3xl italic text-[#f3ead9]">{c.name}</h2>
                  <div className="flex-1 h-px bg-[#e8871e]/25" />
                </div>
                <ProductGrid
                  products={productsByCat[c.slug] || []}
                  cart={cart}
                  onAdd={addToCart}
                  onDec={decFromCart}
                  categoryImage={CATEGORY_IMAGES[c.slug]}
                />
              </Reveal>
            </section>
          ))}

        {/* AVIS CLIENTS */}
        {!loading && reviews.length > 0 && (
          <Reveal>
            <div className="flex items-baseline gap-4 mb-5">
              <h2 className="font-display text-3xl italic text-[#f3ead9]">Avis clients</h2>
              <div className="flex-1 h-px bg-[#e8871e]/25" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.slice(0, 6).map((r) => (
                <div key={r.id} className="bg-[#241609] border border-[#e8871e]/15 rounded-2xl p-4">
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <IconStar key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "text-[#e8871e]" : "text-[#f3ead9]/15"}`} filled={n <= r.rating} />
                    ))}
                  </div>
                  <p className="text-sm text-[#f3ead9]/80">{r.comment}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#f3ead9]/40 mt-3">Connecte-toi depuis "Mon compte" pour laisser ton propre avis.</p>
          </Reveal>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e8871e]/20 py-8 text-center text-sm text-[#f3ead9]/50">
        <p className="font-display italic text-[#e8871e] text-lg mb-1">Les saveurs africaines</p>
        <p>{settings?.phone || "+212 641 549 471"} · TikTok @{settings?.tiktok || "Les_saveurs_africaines"}</p>
        {whatsappSupport && (
          <a
            href={`https://wa.me/${whatsappSupport}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-xs border border-[#e8871e]/30 px-4 py-2 rounded-full hover:bg-[#e8871e]/10 transition"
          >
            <IconWhatsapp className="w-3.5 h-3.5" />
            Support / probleme de livraison
          </a>
        )}
      </footer>

      {/* Bouton support flottant */}
      {whatsappSupport && (
        <a
          href={`https://wa.me/${whatsappSupport}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-30 bg-[#25D366] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-105 transition"
          title="Support WhatsApp"
        >
          <IconWhatsapp className="w-6 h-6" />
        </a>
      )}

      {/* PANIER */}
      {cartOpen && (
        <SidePanel onClose={() => setCartOpen(false)} title="Votre panier">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {cartItems.length === 0 && <p className="text-[#f3ead9]/50 text-sm">Votre panier est vide.</p>}
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm">{item.name}</p>
                  <p className="font-mono-price text-xs text-[#e8871e]">{formatDh(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 border border-[#e8871e]/30 rounded-full px-2 py-1">
                  <button onClick={() => decFromCart(item)}><IconMinus className="w-3.5 h-3.5" /></button>
                  <span className="w-5 text-center text-sm font-mono-price">{item.qty}</span>
                  <button onClick={() => addToCart(item)}><IconPlus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-[#e8871e]/20">
            <div className="flex justify-between text-sm mb-4">
              <span className="text-[#f3ead9]/70">Total</span>
              <span className="font-mono-price text-lg text-[#e8871e]">{formatDh(cartTotal)}</span>
            </div>
            <button
              onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
              disabled={cartItems.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-[#e8871e] disabled:opacity-40 text-[#1b1109] font-medium py-3 rounded-full text-sm hover:bg-[#f0983a] transition"
            >
              Passer la commande
            </button>
          </div>
        </SidePanel>
      )}

      {/* CHECKOUT */}
      {checkoutOpen && (
        <SidePanel onClose={() => setCheckoutOpen(false)} title="Finaliser la commande">
          <CheckoutPanel
            session={session}
            authFetch={authFetch}
            cartItems={cartItems}
            cartTotal={cartTotal}
            settings={settings}
            onNeedLogin={() => { setCheckoutOpen(false); setAccountOpen(true); }}
            onSuccess={() => { setCart({}); setCheckoutOpen(false); }}
          />
        </SidePanel>
      )}

      {/* COMPTE */}
      {accountOpen && (
        <SidePanel onClose={() => setAccountOpen(false)} title={session ? "Mon compte" : "Connexion"}>
          <Compte session={session} setSession={setSession} onClose={() => setAccountOpen(false)} />
        </SidePanel>
      )}
    </div>
  );
}

// ---------- Checkout reel (ecrit dans orders / order_items) ----------
function CheckoutPanel({ session, authFetch, cartItems, cartTotal, settings, onNeedLogin, onSuccess }) {
  const [orderType, setOrderType] = useState("livraison");
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!session) {
      setLoadingAddr(false);
      return;
    }
    authFetch(`profiles?id=eq.${session.user.id}&select=phone`).then((rows) => {
      if (rows?.[0]?.phone) setPhone(rows[0].phone);
    });
    authFetch(`addresses?user_id=eq.${session.user.id}&select=*&order=created_at.desc`)
      .then((rows) => {
        setAddresses(rows || []);
        if (rows?.[0]) setAddressId(rows[0].id);
      })
      .finally(() => setLoadingAddr(false));
  }, [authFetch, session]);

  const deliveryFee = orderType === "livraison" ? Number(settings?.delivery_fee || 0) : 0;
  const total = cartTotal + deliveryFee;

  if (!session) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-sm text-[#f3ead9]/70 mb-4">Connecte-toi ou cree un compte pour passer commande et suivre sa progression.</p>
        <button onClick={onNeedLogin} className="bg-[#e8871e] text-[#1b1109] font-medium px-6 py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition">
          Se connecter
        </button>
      </div>
    );
  }

  async function submit() {
    if (orderType === "livraison" && !addressId) {
      setError("Choisis ou ajoute une adresse de livraison.");
      return;
    }
    if (!phone.trim()) {
      setError("Merci d'indiquer un numero de telephone.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const orderNumber = `CMD-${Date.now().toString(36).toUpperCase()}`;
      const order = await authFetch("orders", {
        method: "POST",
        body: JSON.stringify({
          order_number: orderNumber,
          user_id: session.user.id,
          status: "en_attente",
          order_type: orderType,
          delivery_address_id: orderType === "livraison" ? addressId : null,
          phone,
          notes,
          subtotal: cartTotal,
          delivery_fee: deliveryFee,
          total,
          payment_method: "especes",
        }),
      });
      const orderId = order?.[0]?.id;
      await authFetch("order_items", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify(
          cartItems.map((i) => ({
            order_id: orderId,
            product_id: i.id,
            product_name: i.name,
            quantity: i.qty,
            unit_price: i.price,
            subtotal: i.qty * i.price,
          }))
        ),
      });
      setSuccess(orderNumber);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="font-display italic text-2xl text-[#e8871e] mb-2">Commande envoyee !</p>
        <p className="text-sm text-[#f3ead9]/70 mb-1">Numero : {success}</p>
        <p className="text-xs text-[#f3ead9]/50 mb-6">Suis sa progression depuis "Mon compte" → Commandes.</p>
        <button onClick={onSuccess} className="bg-[#e8871e] text-[#1b1109] font-medium px-6 py-2.5 rounded-full text-sm hover:bg-[#f0983a] transition">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setOrderType("livraison")} className={`flex-1 py-2 rounded-full text-sm border ${orderType === "livraison" ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/30 text-[#f3ead9]/70"}`}>Livraison</button>
        <button onClick={() => setOrderType("emporter")} className={`flex-1 py-2 rounded-full text-sm border ${orderType === "emporter" ? "bg-[#e8871e] text-[#1b1109] border-[#e8871e]" : "border-[#e8871e]/30 text-[#f3ead9]/70"}`}>A emporter</button>
      </div>

      {orderType === "livraison" && (
        <div className="mb-3">
          <label className="text-xs text-[#f3ead9]/60 block mb-1">Adresse de livraison</label>
          {loadingAddr ? (
            <p className="text-xs text-[#f3ead9]/40">Chargement...</p>
          ) : addresses.length === 0 ? (
            <p className="text-xs text-[#f3ead9]/40">Aucune adresse enregistree. Ajoute-en une depuis "Mon compte" → Adresses.</p>
          ) : (
            <select value={addressId} onChange={(e) => setAddressId(e.target.value)}
              className="w-full bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]">
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>{a.label || "Adresse"} — {a.address}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <label className="text-xs text-[#f3ead9]/60 block mb-1">Telephone</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212..."
        className="w-full mb-3 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />

      <label className="text-xs text-[#f3ead9]/60 block mb-1">Notes (optionnel)</label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        className="w-full mb-4 bg-transparent border border-[#e8871e]/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8871e]" />

      <div className="border-t border-[#e8871e]/15 pt-3 mb-4 text-sm space-y-1">
        <div className="flex justify-between text-[#f3ead9]/70"><span>Sous-total</span><span className="font-mono-price">{formatDh(cartTotal)}</span></div>
        {orderType === "livraison" && <div className="flex justify-between text-[#f3ead9]/70"><span>Livraison</span><span className="font-mono-price">{formatDh(deliveryFee)}</span></div>}
        <div className="flex justify-between text-[#e8871e] font-medium"><span>Total</span><span className="font-mono-price">{formatDh(total)}</span></div>
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <button onClick={submit} disabled={saving} className="w-full bg-[#e8871e] text-[#1b1109] font-medium py-3 rounded-full text-sm hover:bg-[#f0983a] transition disabled:opacity-50">
        {saving ? "Envoi..." : "Confirmer la commande"}
      </button>
      <p className="text-xs text-[#f3ead9]/40 mt-3 text-center">Paiement a la livraison / au retrait. Un souci ? Utilise le bouton WhatsApp support.</p>
    </div>
  );
}

function ProductGrid({ products, cart, onAdd, onDec, categoryImage, categories }) {
  if (!products || products.length === 0) {
    return <p className="text-[#f3ead9]/40 text-sm">Aucun plat pour le moment.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p, idx) => {
        const inCart = cart[p.id]?.qty || 0;
        const img =
          p.image_url ||
          categoryImage ||
          CATEGORY_IMAGES[categories?.find((c) => c.id === p.category_id)?.slug] ||
          CATEGORY_IMAGES["nos-sauces"];
        return (
          <Reveal key={p.id} delay={(idx % 8) * 40}>
            <div className="group bg-[#241609] border border-[#e8871e]/15 rounded-2xl overflow-hidden hover:border-[#e8871e]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="relative h-28 sm:h-32 w-full overflow-hidden">
                <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                {p.is_popular && (
                  <span className="absolute top-2 left-2 bg-[#e8871e] text-[#1b1109] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Populaire
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-sm leading-tight flex-1">{p.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono-price text-[#e8871e] text-sm">{formatDh(p.price)}</span>
                  {inCart === 0 ? (
                    <button
                      onClick={() => onAdd(p)}
                      className="w-7 h-7 rounded-full bg-[#e8871e]/15 hover:bg-[#e8871e] hover:text-[#1b1109] flex items-center justify-center transition"
                    >
                      <IconPlus className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-[#e8871e]/15 rounded-full px-1.5 py-0.5">
                      <button onClick={() => onDec(p)} className="w-5 h-5 flex items-center justify-center"><IconMinus className="w-3 h-3" /></button>
                      <span className="text-xs font-mono-price w-3 text-center">{inCart}</span>
                      <button onClick={() => onAdd(p)} className="w-5 h-5 flex items-center justify-center"><IconPlus className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}