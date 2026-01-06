<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arkánum - A Lélek Tükre</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Egyedi stílusok a React kódból átemelve */
        body { background-color: #13131a; color: #e2e8f0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .glass-panel { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .card-flip { transition: transform 0.6s; transform-style: preserve-3d; }
        .card-flip.flipped { transform: rotateY(180deg); }
    </style>
</head>
<body class="min-h-screen flex flex-col">
    <!-- Navigáció -->
    <?php if (isset($_SESSION['user'])): ?>
    <nav class="fixed top-0 w-full z-50 glass-panel border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">🔮 ARKÁNUM</div>
        <div class="flex gap-4 text-sm font-bold uppercase tracking-widest">
            <a href="<?= $appUrl ?>/dashboard" class="hover:text-yellow-400 transition-colors">Főoldal</a>
            <a href="<?= $appUrl ?>/history" class="hover:text-yellow-400 transition-colors">Napló</a>
            <a href="<?= $appUrl ?>/library" class="hover:text-yellow-400 transition-colors">Tudástár</a>
            <button onclick="logout()" class="text-red-400 hover:text-red-300">Kilépés</button>
        </div>
    </nav>
    <div class="pt-24 px-4 container mx-auto flex-1">
        <?php
            if (file_exists("views/$view.php")) {
                include "views/$view.php";
            } else {
                echo "<h1>404 - Az oldal nem található</h1>";
            }
        ?>
    </div>
    <?php else: ?>
        <div class="flex-1 flex items-center justify-center">
            <?php include "views/$view.php"; ?>
        </div>
    <?php endif; ?>

    <script>
        const APP_URL = '<?= $appUrl ?>';
        async function logout() {
            await fetch(APP_URL + '/api/auth/logout');
            window.location.href = APP_URL + '/login';
        }
    </script>
</body>
</html>
