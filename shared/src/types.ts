// Shared TypeScript types for frontend and backend

export interface User {
  id: number;
  username: string;
  displayName: string;
}

export interface Song {
  id: number;
  title: string;
  dropboxFolderPath: string;
  versionCount?: number;
  avgRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Version {
  id: number;
  songId: number;
  versionName: string;
  dropboxFilePath: string;
  fileSize: number;
  avgRating?: number | null;
  commentCount?: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  versionId: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rating {
  id: number;
  versionId: number;
  userId: number;
  userName: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'new_song' | 'new_version' | 'new_comment' | 'new_rating';
  title: string;
  message: string;
  relatedId: number;
  isRead: boolean;
  createdAt: string;
}

export interface LeaderboardData {
  versions: {
    versionId: number;
    songTitle: string;
    versionName: string;
    avgRating: number;
    ratings: {
      userId: number;
      userName: string;
      score: number;
    }[];
  }[];
  userAverages: {
    userId: number;
    userName: string;
    avgScore: number;
    totalRatings: number;
  }[];
}

export interface DropboxSyncResult {
  newSongs: number;
  newVersions: number;
  notifications: Notification[];
  lastSync: string;
}

export interface AuthResponse {
  user: User;
}

export interface ApiError {
  message: string;
  status: number;
}
