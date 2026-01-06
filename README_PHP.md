# Misztikus Tarot - PHP Verzió

Ez a projekt át lett írva **PHP** alapokra, hogy megszüntessük a build folyamatot (`npm run build`) és egyszerűsítsük a telepítést.

## Telepítés

1.  **Követelmények:**
    *   Webszerver (Apache/Nginx) PHP támogatással.
    *   MySQL adatbázis.

2.  **Konfiguráció:**
    *   Szerkeszd a `config.php` fájlt az adatbázis elérési adatokkal.

3.  **Adatbázis inicializálása:**
    *   Futtasd a böngészőben az `install.php` fájlt (pl. `http://localhost/install.php`).
    *   Ez létrehozza a táblákat és feltölti az alap kártyaadatokkal.
    *   **Fontos:** A telepítés után töröld az `install.php`-t!

4.  **Használat:**
    *   Nyisd meg az oldalt (pl. `http://localhost/`).
    *   Jelentkezz be az `admin / admin123` adatokkal (vagy regisztrálj újat).

## Funkciók

*   **Napi Húzás:** 3 lapos húzás (Múlt, Jelen, Jövő) animációval.
*   **Napló:** Korábbi húzások megtekintése.
*   **Tudástár:** Az összes kártya böngészése.
*   **Admin Pult:** GitHub alapú automatikus frissítési rendszer (csak adminoknak).

## Fejlesztés

Nincs build folyamat! A fájlok (`views/*.php`, `api/*.php`) módosítása azonnal érvénybe lép.
A stílusokhoz a Tailwind CSS CDN verzióját használjuk.
