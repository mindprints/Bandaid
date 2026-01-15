import apiClient from './client';
import { Rating } from '../../../shared/src/types';

export const ratingsApi = {
  createOrUpdateRating: async (versionId: number, score: number): Promise<Rating> => {
    const response = await apiClient.post<{ rating: Rating }>(`/versions/${versionId}/ratings`, { score });
    return response.data.rating;
  },

  getRatingsByVersionId: async (versionId: number): Promise<{ ratings: Rating[]; userRating: Rating | null }> => {
    const response = await apiClient.get<{ ratings: Rating[]; userRating: Rating | null }>(`/versions/${versionId}/ratings`);
    return response.data;
  },

  deleteRating: async (versionId: number): Promise<void> => {
    await apiClient.delete(`/versions/${versionId}/ratings`);
  },
};
