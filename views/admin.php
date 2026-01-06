<div class="max-w-4xl mx-auto">
    <h2 class="text-3xl font-bold mb-8 text-white">Adminisztrációs Pult</h2>

    <!-- Tabs -->
    <div class="flex gap-4 mb-8 border-b border-white/10 pb-4">
        <button onclick="showTab('update')" class="px-4 py-2 font-bold text-yellow-500 border-b-2 border-yellow-500" id="tab-btn-update">Rendszer Frissítés</button>
        <button onclick="showTab('users')" class="px-4 py-2 font-bold text-gray-400 hover:text-white" id="tab-btn-users">Felhasználók</button>
    </div>

    <!-- UPDATE TAB -->
    <div id="tab-update" class="tab-content">
        <div class="glass-panel p-6 rounded-xl">
            <h3 class="text-xl font-bold mb-4 text-white">GitHub Frissítési Rendszer</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label class="block text-xs text-gray-400 mb-1">GitHub Tulajdonos</label>
                    <input type="text" id="ghOwner" value="user" class="w-full bg-white/5 border border-white/20 rounded p-2 text-white">
                </div>
                <div>
                    <label class="block text-xs text-gray-400 mb-1">Repo Neve</label>
                    <input type="text" id="ghRepo" value="misztikus-tarot-naplo" class="w-full bg-white/5 border border-white/20 rounded p-2 text-white">
                </div>
                <div>
                    <label class="block text-xs text-gray-400 mb-1">Ág (Branch)</label>
                    <input type="text" id="ghBranch" value="main" class="w-full bg-white/5 border border-white/20 rounded p-2 text-white">
                </div>
            </div>

            <div class="mb-6">
                <label class="block text-xs text-gray-400 mb-1">Frissítési Titkos Kulcs (api.php)</label>
                <input type="password" id="updateSecret" class="w-full bg-white/5 border border-white/20 rounded p-2 text-white" placeholder="Add meg a titkos kulcsot...">
            </div>

            <div class="flex gap-4 items-center mb-6">
                <button onclick="checkUpdates()" class="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold text-white transition-colors">
                    Frissítések Keresése
                </button>
                <span id="versionInfo" class="text-sm text-gray-400"></span>
            </div>

            <div id="updateStatus" class="hidden mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <div id="changesList" class="text-sm font-mono text-gray-300 max-h-40 overflow-y-auto mb-4"></div>
                <button onclick="performUpdate()" class="w-full bg-green-600 hover:bg-green-500 py-2 rounded-lg font-bold text-white">
                    Frissítés Telepítése
                </button>
            </div>

            <div id="logs" class="bg-black/50 p-4 rounded-lg font-mono text-xs text-gray-400 h-48 overflow-y-auto">
                <div>Rendszernapló...</div>
            </div>
        </div>
    </div>

    <!-- USERS TAB -->
    <div id="tab-users" class="hidden tab-content">
        <p class="text-gray-500">Felhasználó kezelés hamarosan...</p>
    </div>
</div>

<script>
function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + tab).classList.remove('hidden');

    // Stílusok frissítése (egyszerűsítve)
    document.querySelectorAll('button[id^="tab-btn-"]').forEach(btn => {
        btn.classList.remove('text-yellow-500', 'border-b-2', 'border-yellow-500');
        btn.classList.add('text-gray-400');
    });
    document.getElementById('tab-btn-' + tab).classList.add('text-yellow-500', 'border-b-2', 'border-yellow-500');
    document.getElementById('tab-btn-' + tab).classList.remove('text-gray-400');
}

function log(msg) {
    const logs = document.getElementById('logs');
    const div = document.createElement('div');
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logs.appendChild(div);
    logs.scrollTop = logs.scrollHeight;
}

let changesToDownload = [];
let remoteSha = '';

async function checkUpdates() {
    const owner = document.getElementById('ghOwner').value;
    const repo = document.getElementById('ghRepo').value;
    const branch = document.getElementById('ghBranch').value;
    const currentSha = localStorage.getItem('app_version_sha');

    log('Frissítések keresése...');

    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`);
        if (!res.ok) throw new Error('GitHub API hiba');
        const data = await res.json();
        remoteSha = data.sha;

        if (currentSha !== remoteSha) {
            log(`Új verzió elérhető! (${remoteSha.substring(0, 7)})`);

            // Fájlok lekérése (egyszerűsített: teljes fa, ha nincs compare)
            // Itt most egyszerűsítünk: ha van SHA különbség, lekérjük a fájl fát.
            // A React kódban Compare API volt, itt is megpróbáljuk.

            if (currentSha) {
                const compareRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/compare/${currentSha}...${remoteSha}`);
                if (compareRes.ok) {
                    const compareData = await compareRes.json();
                    changesToDownload = compareData.files.map(f => f.filename);
                } else {
                    // Fallback
                    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${remoteSha}?recursive=1`);
                    const treeData = await treeRes.json();
                    changesToDownload = treeData.tree.filter(t => t.type === 'blob').map(t => t.path);
                }
            } else {
                // Első futtatás
                const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${remoteSha}?recursive=1`);
                const treeData = await treeRes.json();
                changesToDownload = treeData.tree.filter(t => t.type === 'blob').map(t => t.path);
            }

            document.getElementById('changesList').innerHTML = changesToDownload.map(f => `<div>${f}</div>`).join('');
            document.getElementById('updateStatus').classList.remove('hidden');
        } else {
            log('A rendszer naprakész.');
        }
    } catch (e) {
        log('Hiba: ' + e.message);
    }
}

async function performUpdate() {
    const owner = document.getElementById('ghOwner').value;
    const repo = document.getElementById('ghRepo').value;
    const branch = document.getElementById('ghBranch').value;
    const secret = document.getElementById('updateSecret').value;

    if (!secret) {
        alert('Kérlek add meg a titkos kulcsot!');
        return;
    }

    log('Frissítés indítása...');
    let success = 0;
    let fail = 0;

    for (const file of changesToDownload) {
        log(`Letöltés: ${file}...`);
        try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
            const contentRes = await fetch(rawUrl);
            if (!contentRes.ok) throw new Error('Letöltési hiba');
            const content = await contentRes.text();

            // Küldés a szervernek (api.php)
            // Megjegyzés: A PHP routerben (index.php) ez az útvonal még nincs definiálva,
            // ezért a közvetlen api.php-t hívjuk, vagy létrehozunk egy api/update.php-t.
            // Mivel a korábbi api.php-t írtuk át, használjuk azt.

            // Az elérési út: a gyökérben lévő api.php (amit a React is használt)
            // Vagy létrehozunk egy újat a PHP struktúrában.
            // A legtisztább, ha az 'api/update.php' végpontot használjuk.

            const baseUrl = '<?= $baseUrl ?>';

            const payload = {
                path: file.substring(0, file.lastIndexOf('/')),
                filename: file.split('/').pop(),
                content: content,
                is_system_update: true,
                secret: secret
            };

            const saveRes = await fetch(baseUrl + '/api/update.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const saveResult = await saveRes.json();

            if (saveResult.status === 'success') {
                success++;
            } else {
                fail++;
                log(`HIBA: ${saveResult.message}`);
            }

        } catch (e) {
            fail++;
            log(`HIBA ${file}: ${e.message}`);
        }
    }

    log(`Frissítés kész. Sikeres: ${success}, Hiba: ${fail}`);
    if (fail === 0) {
        localStorage.setItem('app_version_sha', remoteSha);
        alert('Frissítés sikeres!');
        window.location.reload();
    }
}
</script>
