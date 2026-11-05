import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import type { UserGame } from '../../api/library';
import {
  ENERGY_LEVELS,
  MOODS,
  isEnergyLevel,
  isMood,
  pickGame,
  type EnergyLevel,
  type Mood,
  type PickResult,
} from '../../utils/gamePicker';
import { focusRingClass, panelClass } from './styles';

interface GamePickerProps {
  library: UserGame[];
  /** Injectable random source so the picker is deterministic in tests. */
  random?: () => number;
}

const selectClass = `w-full p-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded ${focusRingClass}`;

export const GamePicker: React.FC<GamePickerProps> = ({ library, random }) => {
  const moodId = useId();
  const energyId = useId();
  const [mood, setMood] = useState<Mood>('Relaxed');
  const [energy, setEnergy] = useState<EnergyLevel>('Low');
  const [result, setResult] = useState<PickResult | null>(null);

  const handleSuggest = () => setResult(pickGame(library, mood, energy, random));

  return (
    <section aria-labelledby="game-picker-heading" className={panelClass}>
      <h2 id="game-picker-heading" className="mb-4 text-xl font-semibold">
        Mood / Energy Game Picker
      </h2>

      {library.length === 0 ? (
        <PickerMessage result={{ kind: 'empty-library' }} />
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor={moodId} className="block text-sm text-gray-300">
              Mood
            </label>
            <select
              id={moodId}
              value={mood}
              onChange={(e) => {
                if (isMood(e.target.value)) setMood(e.target.value);
              }}
              className={selectClass}
            >
              {MOODS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={energyId} className="block text-sm text-gray-300">
              Energy Level
            </label>
            <select
              id={energyId}
              value={energy}
              onChange={(e) => {
                if (isEnergyLevel(e.target.value)) setEnergy(e.target.value);
              }}
              className={selectClass}
            >
              {ENERGY_LEVELS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSuggest}
            className={`w-full px-4 py-2 font-bold text-white bg-purple-600 rounded hover:bg-purple-700 ${focusRingClass}`}
          >
            Suggest a Game
          </button>

          <div aria-live="polite">{result && <PickerMessage result={result} />}</div>
        </div>
      )}
    </section>
  );
};

export const PickerMessage: React.FC<{ result: PickResult }> = ({ result }) => {
  if (result.kind === 'empty-library' || result.kind === 'all-completed') {
    const message =
      result.kind === 'empty-library'
        ? 'Your library is empty, so there is nothing to pick from yet.'
        : 'Every game in your library is completed. Add something new to play next.';
    return (
      <div className="p-4 text-sm text-gray-300 bg-gray-700 rounded">
        <p>{message}</p>
        <Link
          to="/library"
          className={`inline-block mt-2 text-purple-300 underline rounded ${focusRingClass}`}
        >
          Browse and add games
        </Link>
      </div>
    );
  }

  const { game } = result;
  return (
    <div className="p-4 border border-purple-500 rounded-lg bg-purple-900/60">
      <p className="text-sm text-purple-200">
        {result.kind === 'match'
          ? 'We recommend:'
          : 'No genre matched your mood, so here is an unfinished game instead:'}
      </p>
      <Link
        to={`/library/${game.user_game_id}`}
        state={{ game }}
        className={`block text-xl font-bold text-white break-words rounded hover:underline ${focusRingClass}`}
      >
        {game.title}
      </Link>
      <p className="text-sm text-gray-300">
        Genre: {game.genre ?? 'Unknown'} · Status: {game.status}
      </p>
    </div>
  );
};
