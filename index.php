<?php
/**
 * Arkánum - No-Build Frontend Loader
 * Dinamikusan összegyűjti a szükséges TypeScript/React fájlokat és betölti az alkalmazást.
 */

// Könyvtárak, amelyekben rekurzívan keresünk
$scanDirs = [
    'cards',
    'components',
    'constants',
    'context',
    'lessons',
    'services',
    // 'hooks' - ha létezik, de a list_files nem mutatta
];

// Gyökérkönyvtár fájljai, amiket be kell tölteni (sorrend számíthat a függőségek miatt, de a require kezeli)
// A types.ts-t előre vesszük
$rootFiles = [
    'types.ts',
    'constants.ts',
    'App.tsx',
    'index.tsx'
];

// Fájlok összegyűjtése
$files = [];

// 1. Gyökér fájlok hozzáadása (ha léteznek)
foreach ($rootFiles as $file) {
    if (file_exists(__DIR__ . '/' . $file)) {
        $files[] = './' . $file;
    }
}

// 2. Mappák rekurzív bejárása
foreach ($scanDirs as $dir) {
    $path = __DIR__ . '/' . $dir;
    if (is_dir($path)) {
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path));
        foreach ($iterator as $file) {
            // Csak .ts és .tsx fájlok
            if ($file->isFile() && preg_match('/\.(ts|tsx)$/', $file->getFilename())) {
                // Relatív útvonal előállítása
                $fullPath = $file->getPathname();
                // Normalizálás '/' elválasztókra minden rendszeren
                $normalizedPath = str_replace(DIRECTORY_SEPARATOR, '/', $fullPath);
                $normalizedBase = str_replace(DIRECTORY_SEPARATOR, '/', __DIR__);

                $relativePath = str_replace($normalizedBase . '/', './', $normalizedPath);
                $files[] = $relativePath;
            }
        }
    }
}

// JSON formátum a JavaScript számára
$criticalFilesJson = json_encode($files);

?>
<!DOCTYPE html>
<html lang="hu">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Arkánum - A Lélek Tükre</title>
    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#4c1d95">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: { gold: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' } },
            fontFamily: { serif: ['Cinzel', 'serif'], sans: ['Lato', 'sans-serif'] },
            animation: { 'float': 'float 6s ease-in-out infinite', 'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', 'fade-in': 'fadeIn 0.5s ease-out forwards' },
            keyframes: { float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } }, fadeIn: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } } }
          },
        },
      }
    </script>
    
    <style>
      body { background-color: #0f172a; background-image: radial-gradient(circle at 50% 0%, #312e81 0%, transparent 50%), radial-gradient(circle at 0% 50%, #4c1d95 0%, transparent 50%), radial-gradient(circle at 100% 50%, #be185d 0%, transparent 50%); background-attachment: fixed; color: #e2e8f0; min-height: 100vh; -webkit-tap-highlight-color: transparent; }
      .glass-panel { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
      .glass-panel-dark { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }
      .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
    </style>

    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "react/": "https://esm.sh/react@^19.2.3/",
    "vite": "https://esm.sh/vite@^7.3.0",
    "@vitejs/plugin-react": "https://esm.sh/@vitejs/plugin-react@^5.1.2",
    "firebase/app": "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js",
    "firebase/auth": "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js",
    "firebase/firestore": "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js",
    "firebase/": "https://esm.sh/firebase@^12.7.0/"
  }
}
</script>
  </head>
  <body>
    <div id="root">
        <div style="height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem;">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gold-500"></div>
            <div style="font-family: 'Cinzel', serif; color: #fbbf24; text-align: center;">
                <div id="loading-status" style="font-size: 1.2rem; font-weight: bold;">Arkánum betöltése...</div>
                <div id="loading-detail" style="font-size: 0.8em; opacity: 0.7; margin-top: 5px; font-family: 'Lato', sans-serif;">Szakrális kapcsolat építése</div>
            </div>
        </div>
    </div>

    <script>
      const modules = {};
      // PHP által generált fájllista
      const CRITICAL_FILES = <?php echo $criticalFilesJson; ?>;

      function updateStatus(msg, detail = "") {
          const s = document.getElementById('loading-status');
          const d = document.getElementById('loading-detail');
          if (s) s.textContent = msg;
          if (d) d.textContent = detail;
      }

      function registerModule(filename, code) {
        try {
          const transformed = Babel.transform(code, {
              presets: ['react', 'typescript'],
              filename: filename,
              plugins: ['transform-modules-commonjs']
          }).code;
          const moduleFn = new Function('require', 'exports', 'module', 'process', transformed);
          modules[filename] = { fn: moduleFn, exports: {}, loaded: false };
        } catch (e) {
          console.error("Babel error: " + filename, e);
          throw e;
        }
      }

      function resolvePath(base, relative) {
          const stack = base.split('/');
          stack.pop(); 
          const parts = relative.split('/');
          for (const part of parts) {
              if (part === '.' || part === '') continue;
              if (part === '..') stack.pop();
              else stack.push(part);
          }
          return stack.join('/');
      }

      function customRequire(id, parent) {
        if (id === 'react') return window.React;
        if (id === 'react-dom' || id === 'react-dom/client') return window.ReactDOM;
        if (id.startsWith('firebase/')) {
            if (window.firebaseModules && window.firebaseModules[id]) return window.firebaseModules[id];
            throw new Error(`Firebase modul nem áll készen: ${id}`);
        }

        let res = id;
        if (id.startsWith('./') || id.startsWith('../')) {
             if (parent) res = resolvePath(parent, id);
        } else { res = './' + id; }

        const cands = [res, res + '.ts', res + '.tsx', res + '/index.tsx', res.replace(/^\.\//, '')];
        for (const c of cands) {
            if (modules[c]) {
                const m = modules[c];
                if (!m.loaded) {
                    m.loaded = true;
                    try {
                        m.fn((iid) => customRequire(iid, c), m.exports, m, { env: { API_KEY: '' } });
                    } catch (e) {
                        console.error("Futási hiba: " + c, e);
                        throw e;
                    }
                }
                return m.exports;
            }
        }
        return {}; 
      }

      async function boot() {
        try {
            updateStatus("Kapcsolódás...", "Égi csatornák megnyitása");
            window.firebaseModules = {};
            const fbPkg = ["firebase/app", "firebase/auth", "firebase/firestore"];
            for (const pkg of fbPkg) {
                window.firebaseModules[pkg] = await import(pkg);
            }

            // Párhuzamos letöltés, de soros regisztráció a konzisztencia érdekében (bár a modulrendszernek mindegy)
            // A fetch-eket elindítjuk egyszerre
            const promises = CRITICAL_FILES.map(path =>
                fetch(path).then(res => {
                    if (!res.ok) throw new Error(`Hiányzó rituális tárgy: ${path}`);
                    return res.text().then(code => ({ path, code }));
                })
            );

            const results = await Promise.all(promises);

            // Regisztráció
            for (const { path, code } of results) {
                updateStatus("Idézés...", path.split('/').pop());
                registerModule(path, code);
            }

            updateStatus("A jövő feltárása...");
            customRequire('./index.tsx', null);
        } catch (err) {
            console.error("Boot hiba:", err);
            document.getElementById('root').innerHTML = `<div class="p-10 text-red-500 bg-black/50 m-4 rounded-xl border border-red-500 text-center">
                <h1 class="text-xl font-bold mb-2">Hiba történt</h1>
                <p>${err.message}</p>
                <button onclick="location.reload()" class="mt-4 bg-red-500 text-white px-4 py-2 rounded">Újrakapcsolódás</button>
            </div>`;
        }
      }
      
      window.onload = boot;
    </script>
  </body>
</html>
