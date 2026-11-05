import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type UserGame, fetchUserLibrary, updateLibraryGame } from '../api/library';
import { ProgressTracker } from '../components/ProgressTracker';
import { type PlaySession, fetchGameSessions, logSession, updateSession, deleteSession } from '../api/sessions';

export const GameDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<UserGame | null>((location.state as any)?.game || null);
  const [sessions, setSessions] = useState<PlaySession[]>([]);
  const [isLoading, setIsLoading] = useState(!game);
  
  // Review/Rating State
  const [review, setReview] = useState(game?.review || '');
  const [rating, setRating] = useState<number | ''>(game?.rating || '');
  
  // Session Form State
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadedIdRef = useRef<number | null>(null);

  // Inline session editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDuration, setEditDuration] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    const numericId = Number(id);

    // Setting `game` below re-runs this effect; avoid fetching the same data twice.
    if (!numericId || loadedIdRef.current === numericId) return;
    loadedIdRef.current = numericId;

    const loadData = async () => {
      try {
        if ((!game || game.user_game_id !== numericId) && user) {
          const library = await fetchUserLibrary(user.id);
          const foundGame = library.find((g) => g.user_game_id === Number(id));
          if (foundGame) {
            setGame(foundGame);
            setReview(foundGame.review || '');
            setRating(foundGame.rating || '');
          } else {
            navigate('/library'); // Game not found in user's library
            return;
          }
        }
        
        // Fetch sessions
        const sessionData = await fetchGameSessions(Number(id));
        setSessions(sessionData);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, user, game, navigate]);

  const handleUpdateDetails = async () => {
    try {
      const updated = await updateLibraryGame(Number(id), { 
        review, 
        // Send null (not undefined) so an existing rating can be cleared.
        rating: rating === '' ? null : Number(rating) 
      });
      setGame((prev) => prev ? { ...prev, review: updated.review, rating: updated.rating } : null);
      alert('Details updated!');
    } catch (err) {
      alert('Failed to update details');
    }
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newSession = await logSession({
        user_game_id: Number(id),
        duration: Number(duration),
        notes: notes || undefined
      });
      setSessions((prev) => [newSession, ...prev]); // Optimistic prepend
      setDuration('');
      setNotes('');
    } catch (err) {
      alert('Failed to log session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (session: PlaySession) => {
    setEditingId(session.id);
    setEditDuration(String(session.duration));
    setEditDate(session.session_date.slice(0, 10));
    setEditNotes(session.notes || '');
  };

  const handleSaveSession = async (sessionId: number) => {
    const minutes = Number(editDuration);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      alert('Duration must be a whole number of minutes');
      return;
    }
    try {
      const updated = await updateSession(sessionId, {
        duration: minutes,
        session_date: editDate,
        notes: editNotes.trim() || null,
      });
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      setEditingId(null);
    } catch (err) {
      alert('Failed to update session');
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      alert('Failed to delete session');
    }
  };

  if (isLoading) return <div className="text-white">Loading details...</div>;
  if (!game) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-white">
      <Link to="/library" className="text-blue-400 hover:underline">&larr; Back to Library</Link>
      
      {/* Game Details Section */}
      <section className="p-6 bg-gray-800 rounded-lg shadow">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold">{game.title}</h1>
            <p className="text-gray-400">Platform: {game.platform} | Genre: {game.genre}</p>
            <p className="font-semibold text-purple-400">Status: <span className="capitalize">{game.status}</span></p>
            
            <div className="pt-4 border-t border-gray-700">
              <label className="block text-sm text-gray-400">Personal Rating (1-5)</label>
              <input 
                type="number" 
                min="1" max="5" 
                value={rating} 
                onChange={(e) => setRating(e.target.value ? Number(e.target.value) : '')}
                className="w-24 p-2 mt-1 bg-gray-700 rounded text-white"
              />
              
              <label className="block mt-4 text-sm text-gray-400">Review</label>
              <textarea 
                value={review} 
                onChange={(e) => setReview(e.target.value)}
                className="w-full h-24 p-2 mt-1 bg-gray-700 rounded text-white"
              />
              
              <button 
                onClick={handleUpdateDetails}
                className="px-4 py-2 mt-4 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Progress & Achievements Section */}
      <ProgressTracker userGameId={game.user_game_id} />

      {/* Play Sessions Section */}
      <section className="p-6 bg-gray-800 rounded-lg shadow">
        <h2 className="mb-4 text-2xl font-bold">Play Sessions</h2>
        
        {/* Log Session Form */}
        <form onSubmit={handleLogSession} className="p-4 mb-6 bg-gray-700 rounded-lg">
          <h3 className="mb-2 font-semibold">Log New Session</h3>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="w-full md:w-1/4">
              <label className="block text-xs text-gray-400">Duration (Minutes)</label>
              <input 
                type="number" required min="1"
                value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2 mt-1 bg-gray-600 rounded text-white"
              />
            </div>
            <div className="w-full md:w-2/4">
              <label className="block text-xs text-gray-400">Notes (Optional)</label>
              <input 
                type="text"
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 mt-1 bg-gray-600 rounded text-white"
                placeholder="Beat the final boss..."
              />
            </div>
            <div className="flex items-end w-full md:w-1/4">
              <button 
                type="submit" disabled={isSubmitting}
                className="w-full px-4 py-2 font-bold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Logging...' : '+ Log Session'}
              </button>
            </div>
          </div>
        </form>

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-400">No play sessions logged yet.</p>
          ) : (
            sessions.map((session) =>
              editingId === session.id ? (
                <div key={session.id} className="p-3 space-y-2 bg-gray-700 rounded">
                  <div className="flex flex-col gap-2 md:flex-row">
                    <input
                      type="number" min="1" value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      aria-label="Duration in minutes"
                      className="w-full p-2 text-white bg-gray-600 rounded md:w-28"
                    />
                    <input
                      type="date" value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      aria-label="Session date"
                      className="w-full p-2 text-white bg-gray-600 rounded md:w-44"
                    />
                    <input
                      type="text" value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      aria-label="Notes" placeholder="Notes"
                      className="flex-1 p-2 text-white bg-gray-600 rounded"
                    />
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => handleSaveSession(session.id)} className="text-green-400 hover:text-green-300">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <span className="font-bold text-blue-400">{session.duration} mins</span>
                    <span className="ml-2 text-sm text-gray-400">
                      ({new Date(`${session.session_date.slice(0, 10)}T00:00:00`).toLocaleDateString()})
                    </span>
                    {session.notes && <p className="mt-1 text-sm text-gray-300">{session.notes}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => startEditing(session)} className="text-sm text-blue-400 hover:text-blue-300">Edit</button>
                    <button onClick={() => handleDeleteSession(session.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </section>
    </div>
  );
};