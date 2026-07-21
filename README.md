# Les saveurs africaines — projet Vite

## Installation
```bash
npm install
npm run dev
```

- Site client : http://localhost:5173/
- Dashboard admin : http://localhost:5173/admin

## Identifiants admin
- Email : jeremiebandoma0@gmail.com
- Mot de passe temporaire : P8ql3ies8Xxxag (a changer apres la premiere connexion)

## Notes
- Tailwind est charge via CDN dans index.html (rapide, sans config PostCSS). A migrer vers une install Tailwind classique avant mise en prod si besoin de perf/purge CSS.
- Connexion Supabase deja configuree (URL + cle anon) dans ClientApp.jsx et AdminApp.jsx.
- Le panier du site client commande via WhatsApp pour l'instant (pas encore ecrit dans la table `orders`).
