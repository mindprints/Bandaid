import apiClient from './client';
import { DropboxSyncResult } from '../../../shared/src/types';

export const syncApi = {
  syncFromDropbox: async (): Promise<DropboxSyncResult> => {
    const response = await apiClient.post<{ data: DropboxSyncResult }>('/sync/dropbox');
    return response.data.data;
  },
};
