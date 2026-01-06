<h2 class="text-3xl font-bold mb-8 text-white">Kártya Tudástár</h2>
<div id="libraryGrid" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6"></div>

<script>
async function loadLibrary() {
    const appUrl = '<?= $appUrl ?>';
    const res = await fetch(appUrl + '/api/cards');
    const cards = await res.json();

    document.getElementById('libraryGrid').innerHTML = cards.map(c => `
        <div class="glass-panel p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors group">
            <div class="relative aspect-[2/3] mb-3 overflow-hidden rounded-lg">
                <img src="${c.image_url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
            </div>
            <div class="text-center font-bold text-white text-sm">${c.name}</div>
        </div>
    `).join('');
}
loadLibrary();
</script>
