import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
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
        <h1 style={{ margin: 0, color: '#667eea' }}>BandAid</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user?.displayName}</span>
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
        <h2>Dashboard</h2>
        <p>Welcome to BandAid! This is your central hub for collaborating on band material.</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
        }}>
          <Link to="/songs" style={{
            padding: '2rem',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: '#333',
            transition: 'transform 0.2s',
          }}>
            <h3 style={{ marginTop: 0, color: '#667eea' }}>Songs</h3>
            <p>View and manage song versions from Dropbox</p>
          </Link>

          <Link to="/leaderboard" style={{
            padding: '2rem',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: '#333',
            transition: 'transform 0.2s',
          }}>
            <h3 style={{ marginTop: 0, color: '#667eea' }}>Leaderboard</h3>
            <p>Compare ratings across versions and members</p>
          </Link>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ marginTop: 0 }}>Coming Soon</h3>
          <ul>
            <li>Dropbox integration for syncing songs</li>
            <li>Rating and commenting system</li>
            <li>Notifications for new uploads</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
