import { useState, useRef, useEffect } from 'react';
import { versionsApi } from '../api/versions';

interface AudioPlayerProps {
  versionId: number;
  versionName: string;
}

export function AudioPlayer({ versionId, versionName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const audioUrl = versionsApi.getAudioUrl(versionId);

  useEffect(() => {
    // Reset state when versionId changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
  }, [versionId]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleError = () => {
    setError('Failed to load audio');
    setIsLoading(false);
    setIsPlaying(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      padding: '1rem',
      background: '#f9f9f9',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
    }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading || !!error}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: error ? '#ccc' : '#667eea',
            color: 'white',
            cursor: isLoading || error ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
            opacity: isLoading || error ? 0.6 : 1,
          }}
        >
          {isLoading ? '...' : isPlaying ? '⏸' : '▶'}
        </button>

        {/* Progress Bar Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* File Name */}
          <div style={{
            fontSize: '0.85rem',
            color: '#333',
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {versionName}
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              onClick={handleSeek}
              style={{
                flex: 1,
                height: '6px',
                background: '#e0e0e0',
                borderRadius: '3px',
                cursor: duration > 0 ? 'pointer' : 'default',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${progressPercentage}%`,
                  background: '#667eea',
                  borderRadius: '3px',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>

            {/* Time Display */}
            <div style={{
              fontSize: '0.8rem',
              color: '#666',
              fontFamily: 'monospace',
              minWidth: '85px',
              textAlign: 'right',
            }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          background: '#fee',
          color: '#c33',
          borderRadius: '4px',
          fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
