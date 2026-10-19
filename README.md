# GameLog

CodePath WEB103 Final Project

Designed and developed by: Quoc Bao Le, Phuong Nguyen, and Muhib Sheikh

🔗 Link to deployed app:

## About

### Description and Purpose

GameLog is a full-stack app for tracking and organizing your gaming life. It gives players one place to record the games they own or want to play, log play sessions, track progress and achievements, write reviews, and view simple stats about their gaming habits. The exact feature set may evolve, but the purpose is to help players understand and manage their time, backlog, and progress across games.

### Inspiration

I like games, and I wanted a simple way to keep track of what I’m playing, what I’ve finished, and what I want to play next without spreadsheets or scattered notes.

## Tech Stack

Frontend: React, Tailwind CSS, Fetch API

Backend: Node.js + Express, PostgreSQL, CORS + dotenv

## Features

> These are the features I intend to include. Each feature will support full CRUD where applicable. GIFs and checkmarks will be added as features are completed.

### 1. Game Library Management

✅ Keep a personal list of games you own, are playing, completed, or want to play.

[gif goes here]

### 2. Play Session Tracking

Record when you play a game, how long the session lasted, and any notes. Users can view, create, edit, and delete play sessions.

[gif goes here]

### 3. Progress & Achievement Logging

Log milestones, achievements, or completion status for any game in the library. Progress entries can be linked back to the game they belong to and support create, view, update, and delete.

[gif goes here]

### 4. Reviews & Ratings

Add a personal rating and short review to any game, then browse reviews alongside the game library.

[gif goes here]

### 5. Backlog / Wishlist Tracking

Track games you want to play, set a priority or interest level, and move games between backlog, playing, and completed statuses.

[gif goes here]

### 6. Stats Dashboard

See a simple overview of gaming activity, including total games, hours played, recent sessions, completion counts, and other summaries.

[gif goes here]

### 7. Custom Feature: Mood / Energy-Based Game Picker

Suggest a game from the user’s library based on current mood, available time, and energy level. This is intended as one of the two custom features.

[gif goes here]

### 8. Custom Feature: Playtime Goals & Streaks

Let users set playtime goals and track streaks, such as consecutive days played or weekly hours toward a target. This is intended as the second custom feature.

[gif goes here]

### [ADDITIONAL FEATURES GO HERE - ADD ALL FEATURES HERE IN THE FORMAT ABOVE; you will check these off and add gifs as you complete them]

## Installation Instructions

git clone https://github.com/junjhon12/tacklelog.git
cd tacklelog

# backend
cd server
npm install

# frontend
cd ../client
npm install

createdb gamelog

psql gamelog < server/db/schema.sql

DATABASE_URL=postgres://localhost:5432/gamelog
PORT=3001

VITE_API_URL=http://localhost:3001

cd server
npm run dev

# in another terminal
curl -X POST http://localhost:3001/api/reset

# Might change later so that both front and back can be launched with one command

# backend
cd server
npm run dev

# frontend
cd client
npm run dev