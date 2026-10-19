# Entity Relationship Diagram

Reference the Creating an Entity Relationship Diagram final project guide in the course portal for more information about how to complete this deliverable.

## Create the List of Tables

1. users
2. games
3. user_games (Join Table)
4. play_sessions
5. goals

## Add the Entity Relationship Diagram

[👉🏾👉🏾👉🏾 Include an image or images of the diagram below. You may also wish to use the following markdown syntax to outline each table, as per your preference.]

### Table: users
| Column Name | Type | Description |
|-------------|------|-------------|
| id | serial | primary key |
| username | varchar | unique user identifier |
| email | varchar | user email address |
| password_hash | varchar | encrypted password |
| created_at | timestamp | account creation date |

### Table: games
| Column Name | Type | Description |
|-------------|------|-------------|
| id | serial | primary key |
| title | varchar | name of the game |
| platform | varchar | primary console or PC |
| genre | varchar | category of the game |
| cover_image_url | varchar | link to box art |

### Table: user_games (Join Table)
| Column Name | Type | Description |
|-------------|------|-------------|
| id | serial | primary key |
| user_id | integer | foreign key references users(id) |
| game_id | integer | foreign key references games(id) |
| status | varchar | e.g., 'backlog', 'playing', 'completed' |
| rating | integer | personal 1-5 score |
| review | text | short personal review |

### Table: play_sessions
| Column Name | Type | Description |
|-------------|------|-------------|
| id | serial | primary key |
| user_game_id| integer | foreign key references user_games(id) |
| duration | integer | session length in minutes |
| session_date| date | when the session occurred |
| notes | text | details or achievements unlocked |

### Table: goals
| Column Name | Type | Description |
|-------------|------|-------------|
| id | serial | primary key |
| user_id | integer | foreign key references users(id) |
| target_hours| integer | weekly playtime goal |
| current_streak| integer| consecutive days played |