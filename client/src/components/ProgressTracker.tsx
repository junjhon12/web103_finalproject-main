import React, { useEffect, useState } from 'react';
import {
  type ProgressEntry,
  fetchProgressEntries,
  createProgressEntry,
  updateProgressEntry,
  deleteProgressEntry,
} from '../api/progress';
import { useToast } from '../context/ToastContext';

interface Props {
  userGameId: number;
}

export const ProgressTracker: React.FC<Props> = ({ userGameId }) => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [entryType, setEntryType] = useState<ProgressEntry['entry_type']>('milestone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchProgressEntries(userGameId)
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch(() => showToast('Failed to load progress', 'error'))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [userGameId, showToast]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createProgressEntry({ user_game_id: userGameId, title, entry_type: entryType });
      setEntries((prev) => [created, ...prev]);
      setTitle('');
      showToast('Progress entry added', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (entry: ProgressEntry) => {
    try {
      const updated = await updateProgressEntry(entry.id, { is_completed: !entry.is_completed });
      setEntries((prev) => prev.map((x) => (x.id === entry.id ? updated : x)));
    } catch {
      showToast('Failed to update entry', 'error');
    }
  };

  const handleSaveTitle = async (entry: ProgressEntry) => {
    if (!editTitle.trim()) return;
    try {
      const updated = await updateProgressEntry(entry.id, { title: editTitle });
      setEntries((prev) => prev.map((x) => (x.id === entry.id ? updated : x)));
      setEditingId(null);
    } catch {
      showToast('Failed to rename entry', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteProgressEntry(id);
      setEntries((prev) => prev.filter((x) => x.id !== id));
    } catch {
      showToast('Failed to delete entry', 'error');
    }
  };

  const completedCount = entries.filter((e) => e.is_completed).length;

  return (
    <section className="p-6 bg-gray-800 rounded-lg shadow">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold">Progress &amp; Achievements</h2>
        {entries.length > 0 && (
          <span className="text-sm text-gray-400">{completedCount}/{entries.length} completed</span>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 p-4 mb-6 bg-gray-700 rounded-lg md:flex-row">
        <input
          type="text" required maxLength={255} value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Defeated the first boss, unlocked a trophy..."
          aria-label="Entry title"
          className="flex-1 p-2 text-white bg-gray-600 rounded"
        />
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value as ProgressEntry['entry_type'])}
          aria-label="Entry type"
          className="p-2 text-white bg-gray-600 rounded"
        >
          <option value="milestone">Milestone</option>
          <option value="achievement">Achievement</option>
        </select>
        <button
          type="submit" disabled={isSubmitting}
          className="px-4 py-2 font-bold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
        >
          + Add
        </button>
      </form>

      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-400">No milestones or achievements logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
              <input
                type="checkbox" checked={entry.is_completed}
                onChange={() => handleToggle(entry)}
                aria-label={`Mark "${entry.title}" complete`}
                className="w-5 h-5 accent-green-500"
              />
              <div className="flex-1 min-w-0">
                {editingId === entry.id ? (
                  <input
                    autoFocus value={editTitle} maxLength={255}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle(entry);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full p-1 text-white bg-gray-600 rounded"
                  />
                ) : (
                  <span className={entry.is_completed ? 'line-through text-gray-400' : ''}>{entry.title}</span>
                )}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  entry.entry_type === 'achievement' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'
                }`}>
                  {entry.entry_type}
                </span>
              </div>
              <div className="flex gap-3 text-sm">
                {editingId === entry.id ? (
                  <>
                    <button onClick={() => handleSaveTitle(entry)} className="text-green-400 hover:text-green-300">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-300">Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingId(entry.id); setEditTitle(entry.title); }}
                      className="text-blue-400 hover:text-blue-300"
                    >Edit</button>
                    <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-300">Delete</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
