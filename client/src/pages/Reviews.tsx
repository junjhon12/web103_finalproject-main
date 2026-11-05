import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserLibrary, type UserGame } from '../api/library';
import { Spinner } from '../components/Spinner';

type SortBy = 'rating' | 'title';

const Stars: React.FC<{ rating: number | null }> = ({ rating }) => (
  <span className="text-yellow-400" aria-label={rating ? `${rating} out of 5 stars` : 'Unrated'}>
    {rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : 'Unrated'}
  </span>
);

export const Reviews: React.FC = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<UserGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('rating');
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchUserLibrary(user.id)
      .then(setGames)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load reviews'))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) return <Spinner />;
  if (error) return <div className="text-red-400">{error}</div>;

  // Only games that have a rating or a written review belong on this page.
  const reviewed = games
    .filter((g) => g.rating !== null || (g.review && g.review.trim() !== ''))
    .filter((g) => (g.rating ?? 0) >= minRating)
    .sort((a, b) =>
      sortBy === 'title' ? a.title.localeCompare(b.title) : (b.rating ?? 0) - (a.rating ?? 0)
    );

  const rated = games.filter((g) => g.rating !== null);
  const average = rated.length
    ? (rated.reduce((sum, g) => sum + (g.rating ?? 0), 0) / rated.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reviews &amp; Ratings</h1>
          {average && (
            <p className="mt-1 text-sm text-gray-400">
              Average rating: <span className="text-yellow-400">{average}/5</span> across {rated.length} rated games
            </p>
          )}
        </div>
        <div className="flex gap-3 text-sm text-gray-400">
          <label>
            Min rating{' '}
            <select
              value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}
              className="p-2 text-white bg-gray-700 border border-gray-600 rounded"
            >
              <option value={0}>Any</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ stars</option>)}
            </select>
          </label>
          <label>
            Sort by{' '}
            <select
              value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="p-2 text-white bg-gray-700 border border-gray-600 rounded"
            >
              <option value="rating">Rating</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </label>
        </div>
      </div>

      {reviewed.length === 0 ? (
        <div className="p-8 text-center text-gray-400 bg-gray-800 rounded">
          No reviews yet. Open a game from your <Link to="/library" className="text-blue-400 hover:underline">library</Link> to
          add a rating and review.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviewed.map((game) => (
            <article key={game.user_game_id} className="p-5 bg-gray-800 rounded-lg shadow">
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/library/${game.user_game_id}`} state={{ game }}
                  className="text-lg font-bold text-blue-400 hover:underline"
                >
                  {game.title}
                </Link>
                <Stars rating={game.rating} />
              </div>
              <p className="text-sm text-gray-400">
                {game.platform || 'Unknown platform'}{game.genre ? ` · ${game.genre}` : ''}
              </p>
              <p className="mt-3 text-gray-200 whitespace-pre-wrap">
                {game.review?.trim() || <span className="italic text-gray-500">No written review.</span>}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
