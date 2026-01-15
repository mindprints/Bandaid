// frontend/src/components/AudioPlayer.tsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface AudioPlayerProps {
  versionId: number;
  versionNumber: number;
  songTitle: string;
  className?: string;
}

export const AudioPlayer = ({ 
  versionId, 
  versionNumber, 
  songTitle,
  className = '' 
}: AudioPlayerProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch audio URL from backend
  useEffect(() => {
    const fetchAudioUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/dropbox/audio/${versionId}`);
        setAudioUrl(response.data.url);
      } catch (err) {
        console.error('Failed to load audio:', err);
        setError('Failed to load audio file');
      } finally {
        setLoading(false);
      }
    };

    fetchAudioUrl();
  }, [versionId]);

  // Update time as audio plays
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Set duration when metadata loads
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Play/pause toggle
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Seek to position
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`audio-player loading ${className}`}>
        <p>Loading audio...</p>
      </div>
    );
  }

  if (error || !audioUrl) {
    return (
      <div className={`audio-player error ${className}`}>
        <p>{error || 'Audio not available'}</p>
      </div>
    );
  }

  return (
    <div className={`audio-player ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="audio-player-info">
        <h4>{songTitle}</h4>
        <p>Version {versionNumber}</p>
      </div>

      <div className="audio-player-controls">
        <button 
          onClick={togglePlayPause}
          className="play-pause-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
        </div>

        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="seek-bar"
        />

        <div className="time-display">
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;