DROP TABLE IF EXISTS play_sessions CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS user_games CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(100),
    genre VARCHAR(100),
    cover_image_url TEXT
);

CREATE TABLE user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'backlog',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    UNIQUE(user_id, game_id)
);

CREATE TABLE play_sessions (
    id SERIAL PRIMARY KEY,
    user_game_id INTEGER REFERENCES user_games(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT
);

CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_hours INTEGER NOT NULL,
    current_streak INTEGER DEFAULT 0
);