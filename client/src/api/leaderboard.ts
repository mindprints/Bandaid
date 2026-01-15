import apiClient from './client';
import { LeaderboardData } from '../../../shared/src/types';

export const leaderboardApi = {
  getLeaderboardData: async (): Promise<LeaderboardData> => {
    const response = await apiClient.get<LeaderboardData>('/leaderboard');
    return response.data;
  },
};
