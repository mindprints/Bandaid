import { Rating } from '../../../shared/src/types';

interface RatingDisplayProps {
  ratings: Rating[];
  avgRating: number | null;
}

export function RatingDisplay({ ratings, avgRating }: RatingDisplayProps) {
  if (ratings.length === 0) {
    return (
      <div style={{
        padding: '1rem',
        background: '#f9f9f9',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
        fontSize: '0.9rem',
      }}>
        No ratings yet. Be the first to rate this version!
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      background: '#f9f9f9',
      borderRadius: '8px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #ddd',
      }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#333' }}>
          All Ratings ({ratings.length})
        </h4>
        {avgRating !== null && (
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#667eea',
          }}>
            {avgRating.toFixed(1)} / 10
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {ratings.map((rating) => (
          <div
            key={rating.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: 'white',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>
                {rating.userName}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>
                {new Date(rating.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: rating.score >= 7 ? '#4CAF50' : rating.score >= 5 ? '#FF9800' : '#f44336',
            }}>
              {rating.score}/10
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
