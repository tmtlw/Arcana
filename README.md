# Arkánum – A Lélek Tükre

Tarot napló, tudástár, közösség és spirituális profil (React + TypeScript + Firebase, opcionális PHP szerveroldali segédek).

## Futtatás fejlesztéshez
1. `npm install`
2. `npm run dev`

Ellenőrzés: `npx tsc --noEmit` (típusellenőrzés), `npm run build`.

## Éles telepítés – biztonsági beállítások
- **Firestore szabályok:** `firestore.rules` → Firebase Console / `firebase deploy --only firestore:rules`.
  Tesztek: `tests/firestore.rules.test.mjs` (Firebase emulátorral).
- **Szerveroldali konfiguráció:** másold a `config.example.php`-t `config.php` néven, és töltsd ki
  (`admin_emails`, `allowed_origins`, `gemini_api_key`). A `config.php` nem kerülhet a repóba.
- A PHP végpontok (`updater.php`, `admin_io.php`, `api.php`, `gemini_proxy.php`) Firebase ID tokent várnak
  (`Authorization: Bearer ...`); az admin műveletekhez a token e-mailje szerepeljen az `admin_emails` listában.
- A `.htaccess` tiltja a `config.php`, `lib/`, `backups/` közvetlen elérését (Apache). Nginx esetén ugyanezt állítsd be.
- A Gemini API kulcs szerver oldalon él; a Firestore-ba (`settings/global`) soha ne kerüljön titok.
