import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { syncApi } from '../api/sync';
import { songsApi } from '../api/songs';
import { Song } from '../../../shared/src/types';

export function SongsPage() {
  const { user, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch songs on mount
  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const fetchedSongs = await songsApi.getAllSongs();
      setSongs(fetchedSongs);
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const result = await syncApi.syncFromDropbox();

      // Show success message
      const message = result.newSongs > 0 || result.newVersions > 0
        ? `Successfully synced! Added ${result.newSongs} song(s) and ${result.newVersions} version(s).`
        : 'Sync complete. No new songs or versions found.';

      setSyncMessage({ type: 'success', text: message });

      // Refresh songs list after sync
      fetchSongs();
    } catch (error: any) {
      console.error('Sync error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to sync from Dropbox. Please try again.';
      setSyncMessage({ type: 'error', text: errorMessage });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{
        background: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#667eea', fontSize: '1.5rem', fontWeight: 'bold' }}>
            BandAid
          </Link>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#666' }}>Dashboard</Link>
            <Link to="/songs" style={{ textDecoration: 'none', color: '#667eea', fontWeight: 'bold' }}>Songs</Link>
            <Link to="/leaderboard" style={{ textDecoration: 'none', color: '#666' }}>Leaderboard</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>{user?.displayName}</span>
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Songs</h2>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '0.75rem 1.5rem',
              background: syncing ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: syncing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {syncing ? 'Syncing...' : 'Sync from Dropbox'}
          </button>
        </div>

        {/* Sync message */}
        {syncMessage && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: syncMessage.type === 'success' ? '#d4edda' : '#f8d7da',
            color: syncMessage.type === 'success' ? '#155724' : '#721c24',
            borderRadius: '4px',
            border: `1px solid ${syncMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}>
            {syncMessage.text}
          </div>
        )}

        {/* Songs list */}
        {loading ? (
          <div style={{
            padding: '3rem',
            background: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666',
          }}>
            <p>Loading songs...</p>
          </div>
        ) : songs.length === 0 ? (
          <div style={{
            padding: '3rem',
            background: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666',
          }}>
            <p>No songs yet. Click "Sync from Dropbox" to import your band's songs.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {songs.map((song) => (
              <Link
                key={song.id}
                to={`/songs/${song.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.25rem' }}>
                    {song.title}
                  </h3>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Versions:</strong> {song.versionCount || 0}
                    </p>
                    {song.avgRating && (
                      <p style={{ margin: '0.25rem 0' }}>
                        <strong>Avg Rating:</strong> {song.avgRating.toFixed(1)} / 10
                      </p>
                    )}
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                      Updated: {new Date(song.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
