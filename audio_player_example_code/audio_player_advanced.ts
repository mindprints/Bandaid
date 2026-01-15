// Optional: Advanced audio player with volume control and playback speed
// frontend/src/components/AdvancedAudioPlayer.tsx

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface AdvancedAudioPlayerProps {
  versionId: number;
  versionNumber: number;
  songTitle: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export const AdvancedAudioPlayer = ({ 
  versionId, 
  versionNumber, 
  songTitle,
  autoPlay = false,
  onEnded
}: AdvancedAudioPlayerProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Auto-play if enabled
  useEffect(() => {
    if (audioUrl && autoPlay && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioUrl, autoPlay]);

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds)
      );
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="audio-player loading">Loading audio...</div>;
  }

  if (error || !audioUrl) {
    return <div className="audio-player error">{error || 'Audio not available'}</div>;
  }

  return (
    <div className="audio-player advanced">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
      />

      <div className="audio-player-header">
        <div className="audio-player-info">
          <h4>{songTitle}</h4>
          <p>Version {versionNumber}</p>
        </div>
        
        <div className="playback-controls">
          <label>Speed: </label>
          <select 
            value={playbackRate} 
            onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
            className="playback-rate-select"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>

      <div className="audio-player-controls">
        <button onClick={() => skip(-10)} className="skip-btn">⏪ 10s</button>
        
        <button onClick={togglePlayPause} className="play-pause-btn">
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button onClick={() => skip(10)} className="skip-btn">10s ⏩</button>

        <div className="time-display">{formatTime(currentTime)}</div>

        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="seek-bar"
        />

        <div className="time-display">{formatTime(duration)}</div>

        <button onClick={toggleMute} className="volume-btn">
          {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="volume-bar"
        />
      </div>
    </div>
  );
};