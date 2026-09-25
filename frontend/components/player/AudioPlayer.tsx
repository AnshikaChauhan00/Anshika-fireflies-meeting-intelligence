"use client";

import { useState } from "react";
import { Pause, Play, RotateCcw, RotateCw, Volume1, Volume2, VolumeX } from "lucide-react";
import { ProgressBar } from "@/components/player/ProgressBar";
import { formatTimestamp } from "@/lib/utils";

interface AudioPlayerProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
  onSkip: (deltaSeconds: number) => void;
  onVolumeChange: (volume: number) => void;
}

export function AudioPlayer({
  currentTime,
  duration,
  isPlaying,
  volume,
  onToggle,
  onSeek,
  onSkip,
  onVolumeChange,
}: AudioPlayerProps) {
  const [volumeOpen, setVolumeOpen] = useState(false);
  const progress = duration > 0 ? currentTime / duration : 0;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Meeting Recording
        </span>
        <span className="text-xs text-gray-400">Simulated playback</span>
      </div>

      <ProgressBar
        progress={progress}
        onSeekFraction={(fraction) => onSeek(fraction * duration)}
        ariaLabel="Meeting playback position"
      />

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 font-mono text-xs text-gray-500 dark:text-gray-400">
          <span data-testid="player-current-time">{formatTimestamp(currentTime)}</span>
          <span>/</span>
          <span>{formatTimestamp(duration)}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSkip(-10)}
            aria-label="Rewind 10 seconds"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus-ring dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 focus-ring"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onSkip(10)}
            aria-label="Forward 10 seconds"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus-ring dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div
          className="relative flex items-center gap-2"
          onMouseEnter={() => setVolumeOpen(true)}
          onMouseLeave={() => setVolumeOpen(false)}
        >
          <button
            type="button"
            aria-label="Volume"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus-ring dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
          >
            <VolumeIcon className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Volume level"
            className={`accent-brand-600 transition-all ${volumeOpen ? "w-16 opacity-100" : "w-0 opacity-0"} overflow-hidden`}
          />
        </div>
      </div>
    </div>
  );
}
