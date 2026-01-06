<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Napi Húzás -->
    <div class="glass-panel p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors" onclick="window.location.href='/reading'">
        <div class="text-4xl mb-4">🃏</div>
        <h3 class="text-xl font-bold text-white mb-2">Napi Húzás</h3>
        <p class="text-sm text-gray-400">Fedezd fel, mit üzennek a kártyák a mai napra.</p>
    </div>

    <!-- Statisztika -->
    <div class="glass-panel p-6 rounded-2xl">
        <div class="text-4xl mb-4">📊</div>
        <h3 class="text-xl font-bold text-white mb-2">Szinted: Lvl <?= $_SESSION['user']['level'] ?></h3>
        <p class="text-sm text-gray-400">XP: <?= $_SESSION['user']['xp'] ?></p>
        <div class="w-full bg-gray-700 rounded-full h-2.5 mt-2">
            <div class="bg-yellow-500 h-2.5 rounded-full" style="width: 45%"></div>
        </div>
    </div>

    <!-- Admin Pult (Csak adminoknak) -->
    <?php if ($_SESSION['user']['role'] === 'admin'): ?>
    <div class="glass-panel p-6 rounded-2xl cursor-pointer bg-red-900/20 border-red-500/30" onclick="window.location.href='/admin'">
        <div class="text-4xl mb-4">🔧</div>
        <h3 class="text-xl font-bold text-white mb-2">Admin Pult</h3>
        <p class="text-sm text-gray-400">Rendszer karbantartás</p>
    </div>
    <?php endif; ?>
</div>

<div class="mt-12">
    <h2 class="text-2xl font-bold mb-6 text-white">Legutóbbi Húzásaid</h2>
    <div id="recentReadings" class="space-y-4">
        <p class="text-gray-500 italic">Betöltés...</p>
    </div>
</div>

<script>
async function loadDashboard() {
    const res = await fetch('/api/readings');
    const readings = await res.json();

    const container = document.getElementById('recentReadings');
    if (readings.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Még nincsenek húzásaid.</p>';
        return;
    }

    container.innerHTML = readings.map(r => `
        <div class="glass-panel p-4 rounded-xl flex justify-between items-center">
            <div>
                <div class="font-bold text-yellow-500">${new Date(r.date).toLocaleDateString()}</div>
                <div class="text-sm text-white">${r.question || 'Napi húzás'}</div>
            </div>
            <div class="text-xs text-gray-400">${r.cards.length} lap</div>
        </div>
    `).join('');
}
loadDashboard();
</script>
