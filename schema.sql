
-- Adatbázis séma az Arkánum projekthez

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings_json TEXT -- JSON mező a beállításoknak (téma, hang, stb.)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(50) PRIMARY KEY, -- pl. 'major_0'
    name VARCHAR(100) NOT NULL,
    arcana ENUM('Major', 'Minor') NOT NULL,
    suit ENUM('Wands', 'Cups', 'Swords', 'Pentacles', 'None') DEFAULT 'None',
    number INT,
    description TEXT,
    meaning_up TEXT, -- Jelentés állítva
    meaning_rev TEXT, -- Jelentés fordítva
    keywords_json TEXT, -- JSON tömb a kulcsszavaknak
    element VARCHAR(20),
    astrology VARCHAR(50),
    image_url VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS spreads (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    positions_json TEXT NOT NULL, -- JSON a pozíciók leírására
    is_system BOOLEAN DEFAULT FALSE, -- Rendszer kirakás vagy felhasználói
    created_by INT, -- NULL ha rendszer
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lessons (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    difficulty ENUM('Kezdő', 'Haladó', 'Mester'),
    content TEXT NOT NULL, -- Markdown tartalom
    xp_reward INT DEFAULT 10,
    is_system BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    spread_id VARCHAR(50),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    question TEXT,
    notes TEXT,
    cards_json TEXT NOT NULL, -- JSON a húzott lapokról (id, pozíció, fordított)
    is_public BOOLEAN DEFAULT FALSE,
    likes INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (spread_id) REFERENCES spreads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reading_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexek a gyorsabb kereséshez
CREATE INDEX idx_readings_user ON readings(user_id);
CREATE INDEX idx_readings_public ON readings(is_public);
CREATE INDEX idx_cards_arcana ON cards(arcana);
