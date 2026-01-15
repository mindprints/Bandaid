import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { leaderboardApi } from '../api/leaderboard';
import { LeaderboardData } from '../../../shared/src/types';

export function LeaderboardPage() {
  const { user, logout } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVersionId, setExpandedVersionId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const data = await leaderboardApi.getLeaderboardData();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (score: number): string => {
    if (score >= 8) return '#4CAF50'; // Green
    if (score >= 5) return '#FF9800'; // Orange
    return '#f44336'; // Red
  };

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const toggleVersion = (versionId: number) => {
    setExpandedVersionId(expandedVersionId === versionId ? null : versionId);
  };

  if (loading) {
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
          <div style={{ padding: '3rem', background: 'white', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
            Loading leaderboard...
          </div>
        </main>
      </div>
    );
  }

  const hasRatings = leaderboardData && (leaderboardData.versions.length > 0 || leaderboardData.userAverages.length > 0);

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
        <h2 style={{ marginBottom: '0.5rem' }}>Leaderboard</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Compare ratings across all song versions and band members.</p>

        {!hasRatings ? (
          <div style={{
            marginTop: '2rem',
            padding: '3rem',
            background: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666',
          }}>
            <p>No ratings yet. Start by rating song versions!</p>
            <Link
              to="/songs"
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              Go to Songs
            </Link>
          </div>
        ) : (
          <>
            {/* Top Rated Versions */}
            {leaderboardData!.versions.length > 0 && (
              <section style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>Top Rated Song Versions</h3>
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
                    <thead>
                      <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#333', width: '60px' }}>Rank</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Song</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>Version</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '120px' }}>Avg Rating</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '100px' }}>Ratings</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '100px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData!.versions.map((version, index) => (
                        <>
                          <tr
                            key={version.versionId}
                            style={{
                              borderBottom: '1px solid #e0e0e0',
                              background: expandedVersionId === version.versionId ? '#f5f5ff' : 'white',
                              cursor: 'pointer',
                            }}
                            onClick={() => toggleVersion(version.versionId)}
                            onMouseEnter={(e) => {
                              if (expandedVersionId !== version.versionId) {
                                e.currentTarget.style.background = '#f9f9f9';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (expandedVersionId !== version.versionId) {
                                e.currentTarget.style.background = 'white';
                              }
                            }}
                          >
                            <td style={{ padding: '1rem', fontSize: '1.2rem' }}>
                              {getMedalEmoji(index + 1) || (index + 1)}
                            </td>
                            <td style={{ padding: '1rem', color: '#333', fontWeight: '500' }}>{version.songTitle}</td>
                            <td style={{ padding: '1rem', color: '#666' }}>{version.versionName}</td>
                            <td style={{
                              padding: '1rem',
                              textAlign: 'center',
                              fontSize: '1.25rem',
                              fontWeight: 'bold',
                              color: getRatingColor(version.avgRating),
                            }}>
                              {version.avgRating.toFixed(1)}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                              {version.ratings.length}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <span style={{
                                fontSize: '1rem',
                                color: '#667eea',
                                transition: 'transform 0.2s',
                                display: 'inline-block',
                                transform: expandedVersionId === version.versionId ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}>
                                ▼
                              </span>
                            </td>
                          </tr>
                          {expandedVersionId === version.versionId && (
                            <tr>
                              <td colSpan={6} style={{ padding: '1rem', background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                                <div style={{ padding: '0.5rem' }}>
                                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#333' }}>
                                    Individual Ratings:
                                  </h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                    {version.ratings.map((rating) => (
                                      <div
                                        key={`${version.versionId}-${rating.userId}`}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '0.5rem 0.75rem',
                                          background: 'white',
                                          borderRadius: '4px',
                                          border: '1px solid #e0e0e0',
                                        }}
                                      >
                                        <span style={{ fontSize: '0.9rem', color: '#333' }}>{rating.userName}</span>
                                        <span style={{
                                          fontSize: '1rem',
                                          fontWeight: 'bold',
                                          color: getRatingColor(rating.score),
                                        }}>
                                          {rating.score}/10
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* User Rating Statistics */}
            {leaderboardData!.userAverages.length > 0 && (
              <section>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>User Rating Statistics</h3>
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
                    <thead>
                      <tr style={{ background: '#f9f9f9', borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#333', width: '60px' }}>Rank</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#333' }}>User</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '150px' }}>Avg Score</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#333', width: '150px' }}>Total Ratings</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold', color: '#333', width: '150px' }}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData!.userAverages.map((userStats, index) => (
                        <tr
                          key={userStats.userId}
                          style={{
                            borderBottom: '1px solid #e0e0e0',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f9f9f9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                          }}
                        >
                          <td style={{ padding: '1rem', fontSize: '1.2rem' }}>
                            {getMedalEmoji(index + 1) || (index + 1)}
                          </td>
                          <td style={{ padding: '1rem', color: '#333', fontWeight: '500' }}>{userStats.userName}</td>
                          <td style={{
                            padding: '1rem',
                            textAlign: 'center',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: getRatingColor(userStats.avgScore),
                          }}>
                            {userStats.avgScore.toFixed(1)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                            {userStats.totalRatings}
                          </td>
                          <td style={{ padding: '1rem', color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            {userStats.avgScore >= 7.5 ? 'Generous Rater' : userStats.avgScore >= 5.5 ? 'Balanced Rater' : 'Critical Rater'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
