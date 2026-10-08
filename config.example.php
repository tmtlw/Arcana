<?php
// Másold config.php néven és töltsd ki. A config.php SOHA nem kerülhet a repóba (.gitignore).
return [
    // Vesszővel elválasztott e-mail címek, akik admin műveleteket végezhetnek (frissítő, tartalomszerkesztő).
    'admin_emails'    => 'admin@pelda.hu',
    // Engedélyezett böngészős origin(ek) CORS-hoz (üresen: csak same-origin).
    'allowed_origins' => 'https://pelda.hu',
    // Gemini API kulcs: csak a szerveren él, a kliens nem látja.
    'gemini_api_key'  => '',
    // Az updater által használt GitHub branch.
    'update_branch'   => 'main',
];
