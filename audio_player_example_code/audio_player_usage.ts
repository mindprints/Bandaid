// Example usage in your app
// frontend/src/pages/SongDetailPage.tsx or similar

import { AudioPlayer } from '../components/AudioPlayer';
import './AudioPlayer.css';

interface Version {
  id: number;
  version_number: number;
  uploaded_at: string;
}

interface Song {
  id: number;
  title: string;
  versions: Version[];
}

export const SongDetailPage = () => {
  const [song, setSong] = useState<Song | null>(null);

  // ... fetch song data ...

  return (
    <div className="song-detail">
      <h1>{song?.title}</h1>
      
      <div className="versions-list">
        <h2>Versions</h2>
        {song?.versions.map((version) => (
          <div key={version.id} className="version-item">
            <AudioPlayer
              versionId={version.id}
              versionNumber={version.version_number}
              songTitle={song.title}
            />
            
            {/* Your existing rating/comment components */}
            <div className="version-actions">
              <RatingComponent versionId={version.id} />
              <CommentSection versionId={version.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Compact usage example
export const VersionListItem = ({ version, songTitle }: any) => {
  return (
    <div className="version-list-item">
      <AudioPlayer
        versionId={version.id}
        versionNumber={version.version_number}
        songTitle={songTitle}
        className="compact"
      />
    </div>
  );
};