import apiClient from './client';
import { Comment } from '../../../shared/src/types';

export const commentsApi = {
  createComment: async (versionId: number, content: string): Promise<Comment> => {
    const response = await apiClient.post<{ comment: Comment }>(`/versions/${versionId}/comments`, { content });
    return response.data.comment;
  },

  getCommentsByVersionId: async (versionId: number): Promise<Comment[]> => {
    const response = await apiClient.get<{ comments: Comment[] }>(`/versions/${versionId}/comments`);
    return response.data.comments;
  },

  updateComment: async (commentId: number, content: string): Promise<Comment> => {
    const response = await apiClient.put<{ comment: Comment }>(`/comments/${commentId}`, { content });
    return response.data.comment;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
