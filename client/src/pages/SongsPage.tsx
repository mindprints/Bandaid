import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function SongsPage() {
  const { user, logout } = useAuth();

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
          <button style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}>
            Sync from Dropbox
          </button>
        </div>

        <div style={{
          padding: '3rem',
          background: 'white',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666',
        }}>
          <p>No songs yet. Click "Sync from Dropbox" to import your band's songs.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            (Dropbox integration will be implemented in Phase 3)
          </p>
        </div>
      </main>
    </div>
  );
}
