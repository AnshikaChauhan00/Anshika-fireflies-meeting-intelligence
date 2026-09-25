"use client";

import { useCallback, useRef, useState } from "react";

interface ProgressBarProps {
  progress: number; // 0 to 1
  onSeekFraction: (fraction: number) => void;
  ariaLabel?: string;
}

export function ProgressBar({ progress, onSeekFraction, ariaLabel = "Seek" }: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fractionFromEvent = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const fraction = (clientX - rect.left) / rect.width;
    return Math.min(1, Math.max(0, fraction));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    onSeekFraction(fractionFromEvent(event.clientX));

    const handleMove = (moveEvent: PointerEvent) => {
      onSeekFraction(fractionFromEvent(moveEvent.clientX));
    };
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") onSeekFraction(Math.min(1, progress + 0.02));
    if (event.key === "ArrowLeft") onSeekFraction(Math.max(0, progress - 0.02));
  };

  const percent = Math.round(progress * 100);

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className="group relative h-1.5 w-full cursor-pointer rounded-full bg-gray-200 focus-ring dark:bg-gray-700"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-brand-600"
        style={{ width: `${percent}%` }}
      />
      <div
        className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-brand-600 opacity-0 shadow transition-opacity group-hover:opacity-100"
        style={{
          left: `${percent}%`,
          opacity: isDragging ? 1 : undefined,
        }}
      />
    </div>
  );
}
