# Misztikus Tarot - PHP Verzió

Ez a projekt át lett írva **PHP** alapokra, hogy megszüntessük a build folyamatot (`npm run build`) és egyszerűsítsük a telepítést.

## Telepítés

1.  **Követelmények:**
    *   Webszerver (Apache/Nginx) PHP támogatással.
    *   MySQL adatbázis.

2.  **Konfiguráció:**
    *   Szerkeszd a `config.php` fájlt az adatbázis elérési adatokkal.

3.  **Adatbázis inicializálása:**
    *   Futtasd a böngészőben az `install.php` fájlt.
    *   Ez létrehozza a táblákat és feltölti az alap kártyaadatokkal.
    *   **Fontos:** A telepítés után töröld az `install.php`-t!

4.  **Futtatás (legegyszerűbb mód):**
    *   Ha nincs telepített webszervered (Apache/XAMPP), használd a PHP beépített szerverét:
    *   Nyiss egy terminált a projekt mappájában.
    *   Futtasd: `php -S localhost:8000 index.php`
    *   Nyisd meg a böngészőben: `http://localhost:8000`

5.  **Használat:**
    *   Jelentkezz be az `admin / admin123` adatokkal (vagy regisztrálj újat).

## Funkciók

*   **Napi Húzás:** 3 lapos húzás (Múlt, Jelen, Jövő) animációval.
*   **Napló:** Korábbi húzások megtekintése.
*   **Tudástár:** Az összes kártya böngészése.
*   **Admin Pult:** GitHub alapú automatikus frissítési rendszer (csak adminoknak).

## Fejlesztés

Nincs build folyamat! A fájlok (`views/*.php`, `api/*.php`) módosítása azonnal érvénybe lép.
A stílusokhoz a Tailwind CSS CDN verzióját használjuk.
