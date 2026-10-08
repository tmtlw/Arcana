# Arkánum – A Lélek Tükre

Tarot napló, tudástár, közösség és spirituális profil.
React + TypeScript (Vite) · Firebase (Auth + Firestore) · Cloudflare Pages + Functions.

## Fejlesztés
1. `npm install`
2. `npm run dev` – csak a frontend (az `/api/*` végpontok nem futnak)
3. Teljes helyi környezet a Functions-szel: `cp .dev.vars.example .dev.vars`, majd `npm run build && npm run cf:dev`

Ellenőrzés: `npx tsc --noEmit` és `npx tsc -p functions/tsconfig.json`.

## Telepítés Cloudflare Pages-re
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git → válaszd ezt a repót.
2. Build command: `npm run build` · Build output directory: `dist` · (Node 20+)
3. Pages → Settings → Variables and Secrets (Production), titokként:
   | Név | Mire kell |
   |---|---|
   | `ADMIN_EMAILS` | vesszővel elválasztott admin e-mailek (ellenőrzött Firebase e-mail szükséges) |
   | `GEMINI_API_KEY` | AI kirakás-import (`/api/gemini`) |
   | `GITHUB_TOKEN` | fine-grained token, *Contents: read/write* erre a repóra (admin tartalomszerkesztő) |
   | `GITHUB_REPO` | pl. `tmtlw/Arcana` |
   Opcionális: `GITHUB_BRANCH` (alapérték `main`), `ALLOWED_ORIGINS`, `FIREBASE_PROJECT_ID`.
4. Firebase Console → Authentication → Settings → Authorized domains: add hozzá a `*.pages.dev` és az egyéni domaint.
5. Firestore szabályok: `firebase deploy --only firestore:rules` (a `firestore.rules` fájlból).

## Működés
- A **Firestore és a Firebase bejelentkezés változatlanul a Firebase-en fut**.
- `functions/api/*` (Cloudflare Pages Functions) váltja a régi PHP fájlokat:
  - `/api/gemini` – Gemini proxy (bejelentkezett felhasználó, a kulcs szerveren), 
  - `/api/content` – admin tartalomszerkesztő: a `cards/`, `lessons/`, `constants/` `.ts` fájlokat a GitHub-ra commitolja, amit a Pages automatikusan újratelepít,
  - `/api/astro` – holdfázis / napjegy számítás.
- Az admin végpontok Firebase ID tokent várnak (`Authorization: Bearer …`) és az `ADMIN_EMAILS` listát ellenőrzik.
- A régi PHP-s frissítő megszűnt: a frissítés = `git push` → automatikus Cloudflare deploy; a visszaállítás a Pages „Rollback” funkciója.
- Biztonsági fejlécek és CSP (egyelőre report-only módban): `public/_headers`.
- Tesztek: `tests/firestore.rules.test.mjs` (Firebase emulátorral).
