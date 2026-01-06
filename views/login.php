<div class="max-w-md w-full glass-panel p-8 rounded-2xl">
    <h2 class="text-3xl font-bold text-center mb-8 text-yellow-500">Bejelentkezés</h2>
    <form id="loginForm" class="space-y-6">
        <div>
            <label class="block text-sm font-bold mb-2">Felhasználónév</label>
            <input type="text" name="username" class="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" required>
        </div>
        <div>
            <label class="block text-sm font-bold mb-2">Jelszó</label>
            <input type="password" name="password" class="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" required>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-yellow-600 to-amber-600 py-3 rounded-lg font-bold hover:scale-105 transition-transform">Belépés</button>
    </form>
    <p class="mt-4 text-center text-sm text-gray-400">
        Nincs még fiókod? <a href="<?= $appUrl ?>/register" class="text-yellow-400 hover:underline">Regisztráció</a>
    </p>
</div>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const appUrl = '<?= $appUrl ?>';

    const res = await fetch(appUrl + '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
    });

    const result = await res.json();
    if (result.success) {
        window.location.href = appUrl + '/dashboard';
    } else {
        alert(result.error);
    }
});
</script>
