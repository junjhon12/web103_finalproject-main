-- Idempotent schema: safe to run on every deploy/start.
-- Existing rows are preserved; tables and indexes are only created when missing.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(100),
    genre VARCHAR(100),
    cover_image_url TEXT
);

CREATE TABLE IF NOT EXISTS user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'backlog',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    UNIQUE(user_id, game_id)
);

CREATE TABLE IF NOT EXISTS play_sessions (
    id SERIAL PRIMARY KEY,
    user_game_id INTEGER REFERENCES user_games(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_hours INTEGER NOT NULL,
    current_streak INTEGER DEFAULT 0
);

-- A user should own exactly one goal. Remove duplicate rows left by older
-- versions before enforcing the constraint.
DELETE FROM goals a
USING goals b
WHERE a.user_id = b.user_id
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS goals_user_id_unique ON goals(user_id);

-- Helpful indexes for the ownership-scoped queries.
CREATE INDEX IF NOT EXISTS user_games_user_id_idx ON user_games(user_id);
CREATE INDEX IF NOT EXISTS play_sessions_user_game_id_idx ON play_sessions(user_game_id);

-- Seed the global games catalogue once, without creating duplicates.
INSERT INTO games (title, platform, genre)
SELECT v.title, v.platform, v.genre
FROM (VALUES
    ('The Legend of Zelda: Breath of the Wild', 'Nintendo Switch', 'Action-Adventure'),
    ('Hades', 'PC', 'Roguelike'),
    ('Cyberpunk 2077', 'PC', 'RPG'),
    ('Stardew Valley', 'Multiplatform', 'Simulation'),
    ('Elden Ring', 'PS5', 'Action RPG')
) AS v(title, platform, genre)
WHERE NOT EXISTS (
    SELECT 1 FROM games g WHERE LOWER(g.title) = LOWER(v.title)
);
