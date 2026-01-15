import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { songsApi } from '../api/songs';
import { versionsApi } from '../api/versions';
import { ratingsApi } from '../api/ratings';
import { commentsApi } from '../api/comments';
import { Song, Version, Rating, Comment } from '../../../shared/src/types';
import { RatingInput } from '../components/RatingInput';
import { RatingDisplay } from '../components/RatingDisplay';
import { CommentForm } from '../components/CommentForm';
import { CommentsList } from '../components/CommentsList';
import { AudioPlayer } from '../components/AudioPlayer';

export function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const [song, setSong] = useState<Song | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [expandedVersionId, setExpandedVersionId] = useState<number | null>(null);
  const [versionRatings, setVersionRatings] = useState<{ [versionId: number]: Rating[] }>({});
  const [userRatings, setUserRatings] = useState<{ [versionId: number]: Rating | null }>({});
  const [versionComments, setVersionComments] = useState<{ [versionId: number]: Comment[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSongAndVersions(parseInt(id, 10));
    }
  }, [id]);

  const fetchSongAndVersions = async (songId: number) => {
    try {
      setLoading(true);
      setError(null);

      const [songData, versionsData] = await Promise.all([
        songsApi.getSongById(songId),
        versionsApi.getVersionsBySongId(songId),
      ]);

      setSong(songData);
      setVersions(versionsData);
    } catch (err: any) {
      console.error('Failed to fetch song details:', err);
      setError('Failed to load song details');
    } finally {
      setLoading(false);
    }
  };

  const toggleVersion = async (versionId: number) => {
    if (expandedVersionId === versionId) {
      setExpandedVersionId(null);
      return;
    }

    setExpandedVersionId(versionId);

    // Fetch ratings and comments for this version if not already loaded
    if (!versionRatings[versionId]) {
      try {
        const { ratings, userRating } = await ratingsApi.getRatingsByVersionId(versionId);
        setVersionRatings((prev) => ({ ...prev, [versionId]: ratings }));
        setUserRatings((prev) => ({ ...prev, [versionId]: userRating }));
      } catch (err) {
        console.error('Failed to fetch ratings:', err);
      }
    }

    if (!versionComments[versionId]) {
      try {
        const comments = await commentsApi.getCommentsByVersionId(versionId);
        setVersionComments((prev) => ({ ...prev, [versionId]: comments }));
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    }
  };

  const handleRatingSubmit = async (versionId: number, score: number) => {
    try {
      const rating = await ratingsApi.createOrUpdateRating(versionId, score);

      // Update user rating
      setUserRatings((prev) => ({ ...prev, [versionId]: rating }));

      // Refresh all ratings for this version
      const { ratings } = await ratingsApi.getRatingsByVersionId(versionId);
      setVersionRatings((prev) => ({ ...prev, [versionId]: ratings }));

      // Update version avg rating
      const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
      setVersions((prev) =>
        prev.map((v) => (v.id === versionId ? { ...v, avgRating } : v))
      );
    } catch (err) {
      console.error('Failed to submit rating:', err);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const handleCommentSubmit = async (versionId: number, content: string) => {
    try {
      await commentsApi.createComment(versionId, content);

      // Refresh comments
      const comments = await commentsApi.getCommentsByVersionId(versionId);
      setVersionComments((prev) => ({ ...prev, [versionId]: comments }));

      // Update comment count
      setVersions((prev) =>
        prev.map((v) => (v.id === versionId ? { ...v, commentCount: comments.length } : v))
      );
    } catch (err) {
      console.error('Failed to submit comment:', err);
      alert('Failed to submit comment. Please try again.');
    }
  };

  const handleCommentUpdate = async (commentId: number, content: string) => {
    try {
      await commentsApi.updateComment(commentId, content);

      // Refresh comments for the version
      if (expandedVersionId) {
        const comments = await commentsApi.getCommentsByVersionId(expandedVersionId);
        setVersionComments((prev) => ({ ...prev, [expandedVersionId]: comments }));
      }
    } catch (err) {
      console.error('Failed to update comment:', err);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    try {
      await commentsApi.deleteComment(commentId);

      // Refresh comments for the version
      if (expandedVersionId) {
        const comments = await commentsApi.getCommentsByVersionId(expandedVersionId);
        setVersionComments((prev) => ({ ...prev, [expandedVersionId]: comments }));

        // Update comment count
        setVersions((prev) =>
          prev.map((v) => (v.id === expandedVersionId ? { ...v, commentCount: comments.length } : v))
        );
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#666',
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#f44336',
        }}>
          {error || 'Song not found'}
        </div>
      </div>
    );
  }

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
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/songs" style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Songs
          </Link>
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{song.title}</h2>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            <p style={{ margin: '0.25rem 0' }}>
              <strong>Versions:</strong> {versions.length}
            </p>
            {song.avgRating && (
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Average Rating:</strong> {song.avgRating.toFixed(1)} / 10
              </p>
            )}
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', color: '#333' }}>Versions</h3>

        {versions.length === 0 ? (
          <div style={{
            padding: '3rem',
            background: 'white',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#666',
          }}>
            No versions found for this song.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {versions.map((version) => (
              <div
                key={version.id}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => toggleVersion(version.id)}
                  style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: expandedVersionId === version.id ? '#f9f9f9' : 'white',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (expandedVersionId !== version.id) {
                      e.currentTarget.style.background = '#f9f9f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (expandedVersionId !== version.id) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.1rem' }}>
                      {version.versionName}
                    </h4>
                    <div style={{ color: '#666', fontSize: '0.85rem' }}>
                      <span style={{ marginRight: '1rem' }}>
                        Size: {formatFileSize(version.fileSize)}
                      </span>
                      {version.avgRating && (
                        <span style={{ marginRight: '1rem' }}>
                          Avg Rating: {version.avgRating.toFixed(1)}/10
                        </span>
                      )}
                      <span>
                        Comments: {version.commentCount || 0}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    color: '#667eea',
                    transition: 'transform 0.2s',
                    transform: expandedVersionId === version.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    ▼
                  </div>
                </div>

                {expandedVersionId === version.id && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid #e0e0e0', background: '#fafafa' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <AudioPlayer versionId={version.id} versionName={version.versionName} />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#333' }}>Rate This Version</h5>
                      <RatingInput
                        versionId={version.id}
                        currentRating={userRatings[version.id]?.score || null}
                        onRatingSubmit={(score) => handleRatingSubmit(version.id, score)}
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <RatingDisplay
                        ratings={versionRatings[version.id] || []}
                        avgRating={version.avgRating || null}
                      />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#333' }}>Add a Comment</h5>
                      <CommentForm onSubmit={(content) => handleCommentSubmit(version.id, content)} />
                    </div>

                    <div>
                      <CommentsList
                        comments={versionComments[version.id] || []}
                        currentUserId={user?.id || 0}
                        onUpdate={handleCommentUpdate}
                        onDelete={handleCommentDelete}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
