import apiClient from './client';
import { Version } from '../../../shared/src/types';

export const versionsApi = {
  getVersionsBySongId: async (songId: number): Promise<Version[]> => {
    const response = await apiClient.get<{ versions: Version[] }>(`/songs/${songId}/versions`);
    return response.data.versions;
  },

  getVersionById: async (versionId: number): Promise<Version> => {
    const response = await apiClient.get<{ version: Version }>(`/versions/${versionId}`);
    return response.data.version;
  },

  getAudioUrl: (versionId: number): string => {
    return `${apiClient.defaults.baseURL}/versions/${versionId}/audio`;
  },
};
