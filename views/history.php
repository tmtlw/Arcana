<h2 class="text-3xl font-bold mb-8 text-white">Előző Húzások</h2>
<div id="historyList" class="space-y-6"></div>

<script>
async function loadHistory() {
    const appUrl = '<?= $appUrl ?>';
    const res = await fetch(appUrl + '/api/readings');
    const readings = await res.json();

    document.getElementById('historyList').innerHTML = readings.map(r => {
        // XSS védelem
        const escape = (str) => str ? str.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
        const question = escape(r.question);
        const notes = escape(r.notes);

        return `
        <div class="glass-panel p-6 rounded-2xl">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <div class="text-yellow-500 font-bold text-lg">${new Date(r.date).toLocaleDateString()}</div>
                    <div class="text-xl text-white italic">"${question}"</div>
                </div>
                <button class="text-red-400 hover:text-white" onclick="alert('Törlés funkció hamarosan...')">🗑️</button>
            </div>
            <div class="grid grid-cols-3 gap-4">
                ${r.cards.map(c => `
                    <div class="text-center">
                        <div class="text-xs text-gray-400 mb-1">Pozíció ${c.position + 1}</div>
                        <div class="font-bold text-white">${c.cardId}</div>
                    </div>
                `).join('')}
            </div>
            ${notes ? `<div class="mt-4 p-4 bg-white/5 rounded-lg text-sm text-gray-300 italic">${notes}</div>` : ''}
        </div>
    `}).join('');
}
loadHistory();
</script>
