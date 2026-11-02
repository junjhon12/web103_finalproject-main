import type { UserGame } from '../api/library';

export const MOODS = ['Relaxed', 'Action-Oriented', 'Thoughtful'] as const;
export const ENERGY_LEVELS = ['High', 'Medium', 'Low'] as const;

export type Mood = (typeof MOODS)[number];
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

const MOOD_KEYWORDS: Record<Mood, string[]> = {
  Relaxed: ['puzzle', 'simulation', 'strategy', 'casual'],
  'Action-Oriented': ['action', 'shooter', 'fighting', 'platformer'],
  Thoughtful: ['rpg', 'adventure', 'story', 'mystery'],
};

const ENERGY_KEYWORDS: Record<EnergyLevel, string[]> = {
  High: ['action', 'multiplayer', 'competitive'],
  Medium: [],
  Low: ['turn-based', 'narrative', 'casual'],
};

export type PickResult =
  | { kind: 'empty-library' }
  | { kind: 'all-completed' }
  | { kind: 'match'; game: UserGame }
  | { kind: 'fallback'; game: UserGame };

export const isMood = (value: string): value is Mood =>
  (MOODS as readonly string[]).includes(value);

export const isEnergyLevel = (value: string): value is EnergyLevel =>
  (ENERGY_LEVELS as readonly string[]).includes(value);

export const gameMatchesMood = (game: UserGame, mood: Mood, energy: EnergyLevel): boolean => {
  if (!game.genre) return false;
  const genre = game.genre.toLowerCase();
  const keywords = [...MOOD_KEYWORDS[mood], ...ENERGY_KEYWORDS[energy]];
  return keywords.some((keyword) => genre.includes(keyword));
};

/**
 * Picks a non-completed game for the given mood and energy.
 * Genre matches are preferred; otherwise any unfinished game is used.
 * `random` must return a number in [0, 1) and is injectable for tests.
 */
export const pickGame = (
  library: UserGame[],
  mood: Mood,
  energy: EnergyLevel,
  random: () => number = Math.random
): PickResult => {
  if (library.length === 0) return { kind: 'empty-library' };

  const playable = library.filter((game) => game.status !== 'completed');
  if (playable.length === 0) return { kind: 'all-completed' };

  const matches = playable.filter((game) => gameMatchesMood(game, mood, energy));
  const pool = matches.length > 0 ? matches : playable;
  const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
  const game = pool[index];

  return matches.length > 0 ? { kind: 'match', game } : { kind: 'fallback', game };
};
