import { useState, useEffect } from 'react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  initialValue?: string;
  isEditing?: boolean;
  onCancel?: () => void;
}

export function CommentForm({ onSubmit, initialValue = '', isEditing = false, onCancel }: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setContent(initialValue);
  }, [initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      if (!isEditing) {
        setContent('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '1rem',
        background: '#f9f9f9',
        borderRadius: '8px',
        marginBottom: '1rem',
      }}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        disabled={isSubmitting}
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '0.75rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          style={{
            padding: '0.5rem 1rem',
            background: !content.trim() || isSubmitting ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !content.trim() || isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
          }}
        >
          {isSubmitting ? 'Submitting...' : isEditing ? 'Update Comment' : 'Post Comment'}
        </button>

        {isEditing && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
