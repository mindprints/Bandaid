import { useState, useEffect } from 'react';

interface RatingInputProps {
  versionId: number;
  currentRating: number | null;
  onRatingSubmit: (score: number) => Promise<void>;
}

export function RatingInput({ versionId: _versionId, currentRating, onRatingSubmit }: RatingInputProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(currentRating);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedScore(currentRating);
  }, [currentRating]);

  const handleSubmit = async () => {
    if (selectedScore === null) return;

    setIsSubmitting(true);
    try {
      await onRatingSubmit(selectedScore);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      padding: '1rem',
      background: '#f9f9f9',
      borderRadius: '8px',
      marginBottom: '1rem',
    }}>
      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#333' }}>
        {currentRating ? 'Update Your Rating' : 'Rate This Version'}
      </h4>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            onClick={() => setSelectedScore(score)}
            style={{
              width: '40px',
              height: '40px',
              border: selectedScore === score ? '2px solid #667eea' : '1px solid #ddd',
              background: selectedScore === score ? '#667eea' : 'white',
              color: selectedScore === score ? 'white' : '#333',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: selectedScore === score ? 'bold' : 'normal',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedScore !== score) {
                e.currentTarget.style.borderColor = '#667eea';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedScore !== score) {
                e.currentTarget.style.borderColor = '#ddd';
              }
            }}
          >
            {score}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedScore === null || isSubmitting}
        style={{
          padding: '0.5rem 1rem',
          background: selectedScore === null || isSubmitting ? '#ccc' : '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: selectedScore === null || isSubmitting ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
          fontWeight: 'bold',
        }}
      >
        {isSubmitting ? 'Submitting...' : currentRating ? 'Update Rating' : 'Submit Rating'}
      </button>
    </div>
  );
}
