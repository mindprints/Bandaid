import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LeaderboardPage() {
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
            <Link to="/songs" style={{ textDecoration: 'none', color: '#666' }}>Songs</Link>
            <Link to="/leaderboard" style={{ textDecoration: 'none', color: '#667eea', fontWeight: 'bold' }}>Leaderboard</Link>
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
        <h2>Leaderboard</h2>
        <p>Compare ratings across all song versions and band members.</p>

        <div style={{
          marginTop: '2rem',
          padding: '3rem',
          background: 'white',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666',
        }}>
          <p>No ratings yet. Start by syncing songs and rating versions!</p>
          <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            (Ratings system will be implemented in Phase 5)
          </p>
        </div>
      </main>
    </div>
  );
}
