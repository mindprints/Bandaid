import apiClient from './client';
import { Song } from '../../../shared/src/types';

export const songsApi = {
  getAllSongs: async (): Promise<Song[]> => {
    const response = await apiClient.get<{ songs: Song[] }>('/songs');
    return response.data.songs;
  },

  getSongById: async (id: number): Promise<Song> => {
    const response = await apiClient.get<{ song: Song }>(`/songs/${id}`);
    return response.data.song;
  },
};
