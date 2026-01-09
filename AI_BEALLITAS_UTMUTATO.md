# Google Gemini API Beállítási Útmutató

Ha a "Gemini API Error: 404" hibát kapod, az általában azt jelenti, hogy a rendszer nem találja a megfelelő mesterséges intelligencia modellt a megadott API kulccsal. Ez lehet azért, mert a kulcs nem rendelkezik megfelelő jogosultságokkal, vagy a Google AI Studio-ban nincs engedélyezve a szolgáltatás.

Kövesd az alábbi lépéseket a helyes beállításhoz:

## 1. Google AI Studio Fiók
1. Látogass el a **[Google AI Studio](https://aistudio.google.com/)** weboldalra.
2. Jelentkezz be a Google fiókoddal.
3. Fogadd el a felhasználási feltételeket, ha először jársz itt.

## 2. API Kulcs Létrehozása
1. A bal oldali menüben vagy a főoldalon kattints a **"Get API key"** (API kulcs beszerzése) gombra.
2. Kattints a **"Create API key"** gombra.
3. Választhatsz:
   - **Create API key in new project**: Ez a legegyszerűbb, automatikusan létrehoz mindent.
   - Meglévő Google Cloud projektet is kiválaszthatsz, ha van.
4. A rendszer generál egy hosszú karakterláncot (pl. `AIzaSy...`). **Ezt másold ki!**

## 3. Kulcs Beállítása az Alkalmazásban
1. Nyisd meg a Tarot alkalmazást.
2. Menj a **Beállítások** (Admin) felületre.
3. Keresd meg a **Gemini API Kulcs** mezőt.
4. Illeszd be a kimásolt kulcsot.
5. mentsd el.

## 4. Hibaelhárítás
Ha továbbra is 404-es hibát kapsz:
- **Számlázás (Billing):** Bár a Gemini 1.5 Flash ingyenes sávval rendelkezik, bizonyos régebbi fiókoknál vagy projekteknél kérheti a számlázási fiók hozzákapcsolását a Google Cloud Console-ban. Próbálj meg új API kulcsot létrehozni egy *teljesen új* projektben a "Get API key" menüben.
- **Régió:** Bizonyos országokban korlátozott lehet az elérés. Ha VPN-t használsz, próbáld meg kikapcsolni, vagy válts USA/EU régióra.
- **Modell Jogosultság:** Ellenőrizd, hogy a Google AI Studio-ban a "Create New" gombra kattintva látsz-e olyat, hogy "Gemini 1.5 Flash". Ha ott működik a chat, akkor a kulcsnak is működnie kell.

## Technikai Információ (Fejlesztőknek)
Az alkalmazás jelenleg a következő modelleket próbálja elérni sorrendben:
1. `gemini-1.5-flash` (Leggyorsabb, ajánlott)
2. `gemini-1.5-pro` (Okosabb, de lassabb)
3. `gemini-pro-vision` (Régebbi típus)

A 404 hiba konkrétan azt jelenti: "Resource Not Found" – vagyis a megadott modell név nem elérhető a kulcsod számára.
