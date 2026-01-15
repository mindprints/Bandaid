import { useState } from 'react';
import { Comment } from '../../../shared/src/types';
import { CommentForm } from './CommentForm';

interface CommentsListProps {
  comments: Comment[];
  currentUserId: number;
  onUpdate: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

export function CommentsList({ comments, currentUserId, onUpdate, onDelete }: CommentsListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (comments.length === 0) {
    return (
      <div style={{
        padding: '1rem',
        background: '#f9f9f9',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
        fontSize: '0.9rem',
      }}>
        No comments yet. Be the first to comment!
      </div>
    );
  }

  const handleUpdate = async (commentId: number, content: string) => {
    await onUpdate(commentId, content);
    setEditingId(null);
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setDeletingId(commentId);
    try {
      await onDelete(commentId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{
      padding: '1rem',
      background: '#f9f9f9',
      borderRadius: '8px',
    }}>
      <h4 style={{
        margin: '0 0 1rem 0',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #ddd',
        fontSize: '0.95rem',
        color: '#333',
      }}>
        Comments ({comments.length})
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              padding: '1rem',
              background: 'white',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
            }}
          >
            {editingId === comment.id ? (
              <CommentForm
                initialValue={comment.content}
                isEditing={true}
                onSubmit={(content) => handleUpdate(comment.id, content)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>
                      {comment.userName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                      {comment.updatedAt !== comment.createdAt && ' (edited)'}
                    </div>
                  </div>

                  {comment.userId === currentUserId && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setEditingId(comment.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'white',
                          color: '#667eea',
                          border: '1px solid #667eea',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'white',
                          color: '#f44336',
                          border: '1px solid #f44336',
                          borderRadius: '4px',
                          cursor: deletingId === comment.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        {deletingId === comment.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{
                  fontSize: '0.9rem',
                  color: '#333',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}>
                  {comment.content}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
