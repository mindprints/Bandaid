import { useState, useRef, useEffect } from 'react';
import { versionsApi } from '../api/versions';
import './AudioPlayer.css';

interface AudioPlayerProps {
  versionId: number;
  versionName: string;
  songTitle?: string;
  className?: string;
}

export function AudioPlayer({
  versionId,
  versionName,
  songTitle,
  className = ''
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Construct URL
  const audioUrl = versionsApi.getAudioUrl(versionId);

  // Reset state when versionId changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [versionId]);

  // Check if audio is accessible before trying to play/load
  const checkAudioAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(audioUrl, { method: 'HEAD' });
      if (!response.ok) {
        // If HEAD fails, try GET to get the error body
        const errResponse = await fetch(audioUrl);
        const errData = await errResponse.json();
        throw new Error(errData.error || errData.message || 'Failed to load audio');
      }
      return true;
    } catch (err: any) {
      console.error('Audio check failed:', err);
      setError(err.message || 'Failed to load audio');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If we haven't played yet and verify failed, don't play
      if (error) return;

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        // If play failed, it might be due to source error. Check it.
        await checkAudioAvailability();
      }
    }
  };

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
      setError(null);
    }
  };

  // Handle errors
  const handleError = () => {
    // If native audio error occurs, check availability to get detailed message
    if (!error) {
      checkAudioAvailability();
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

  // Sync play state with audio events (in case of external pause/play)
  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`audio-player error ${className}`}>
        <p>Error: {error}</p>
        <button
          onClick={() => { setError(null); checkAudioAvailability(); }}
          style={{ marginTop: '0.5rem', padding: '4px 8px', cursor: 'pointer' }}
        >
          Retry
        </button>
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
        onPlay={onPlay}
        onPause={onPause}
        onEnded={() => setIsPlaying(false)}
        onError={handleError}
      />

      <div className="audio-player-info">
        {songTitle && <h4>{songTitle}</h4>}
        <p>{versionName}</p>
      </div>

      <div className="audio-player-controls">
        <button
          onClick={togglePlayPause}
          className="play-pause-btn"
          disabled={loading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {loading ? '...' : isPlaying ? '⏸' : '▶'}
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
}
