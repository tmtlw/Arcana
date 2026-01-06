<div class="max-w-4xl mx-auto">
    <div id="setupPhase">
        <h2 class="text-3xl font-bold text-center mb-8 text-yellow-500">Koncentrálj a kérdésedre...</h2>
        <input type="text" id="questionInput" placeholder="Mi a kérdésed az Univerzumhoz?" class="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xl text-center text-white focus:border-yellow-500 outline-none mb-8">

        <div class="flex justify-center">
            <button onclick="drawCards()" class="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 rounded-full text-xl font-bold hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                Kártyák Húzása
            </button>
        </div>
    </div>

    <div id="resultPhase" class="hidden animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8" id="cardsContainer">
            <!-- Kártyák helye -->
        </div>

        <div class="bg-white/5 p-6 rounded-2xl border border-white/10">
            <textarea id="notesInput" placeholder="Jegyzetek..." class="w-full bg-transparent text-white outline-none h-24 resize-none"></textarea>
            <div class="flex justify-end mt-4">
                <button onclick="saveReading()" class="bg-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-500 transition-colors">Mentés a Naplóba</button>
            </div>
        </div>
    </div>
</div>

<script>
let drawnCards = [];
const baseUrl = '<?= $baseUrl ?>';

async function drawCards() {
    const question = document.getElementById('questionInput').value;
    if (!question) {
        if(!confirm("Biztosan kérdés nélkül szeretnél húzni?")) return;
    }

    // Kártyák lekérése
    const res = await fetch(baseUrl + '/api/cards');
    const allCards = await res.json();

    // Véletlenszerű 3 lap (Múlt, Jelen, Jövő)
    const shuffled = allCards.sort(() => 0.5 - Math.random());
    drawnCards = shuffled.slice(0, 3).map((c, i) => ({
        ...c,
        isReversed: Math.random() < 0.2, // 20% esély fordított lapra
        position: i
    }));

    // UI Frissítés
    document.getElementById('setupPhase').classList.add('hidden');
    document.getElementById('resultPhase').classList.remove('hidden');

    const container = document.getElementById('cardsContainer');
    container.innerHTML = drawnCards.map(c => `
        <div class="flex flex-col items-center">
            <div class="relative w-full aspect-[2/3] mb-4 group perspective">
                <div class="w-full h-full relative transition-transform duration-700 transform-style-3d group-hover:scale-105">
                    <img src="${c.image_url}" class="w-full h-full object-cover rounded-xl shadow-2xl ${c.isReversed ? 'rotate-180' : ''}">
                </div>
            </div>
            <h3 class="text-lg font-bold text-yellow-400">${c.name}</h3>
            <p class="text-xs text-gray-400 uppercase tracking-widest">${c.isReversed ? 'Fordított' : 'Álló'}</p>
            <p class="text-sm text-center mt-2 text-gray-300">${c.meaning_up}</p>
        </div>
    `).join('');
}

async function saveReading() {
    const question = document.getElementById('questionInput').value;
    const notes = document.getElementById('notesInput').value;

    const payload = {
        question,
        notes,
        cards: drawnCards.map(c => ({ cardId: c.id, isReversed: c.isReversed, position: c.position }))
    };

    const res = await fetch(baseUrl + '/api/readings', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
        alert("Sikeres mentés!");
        window.location.href = baseUrl + '/history';
    } else {
        alert("Hiba mentéskor.");
    }
}
</script>
