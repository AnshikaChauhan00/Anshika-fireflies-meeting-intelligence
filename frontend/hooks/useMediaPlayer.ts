"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives a controlled "mock" media player: no audio file is required (the
 * assignment explicitly allows a controlled mock player in place of real
 * audio/video). It advances `currentTime` on a requestAnimationFrame loop
 * while playing, exactly like a real <video>/<audio> element would fire
 * `timeupdate`, so the rest of the app (transcript sync, seek bar) can
 * treat it identically to a real player.
 */
export function useMediaPlayer(durationSeconds: number) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const stopLoop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastTickRef.current = null;
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      stopLoop();
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTickRef.current === null) lastTickRef.current = timestamp;
      const deltaSeconds = (timestamp - lastTickRef.current) / 1000;
      lastTickRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + deltaSeconds;
        if (next >= durationSeconds) {
          setIsPlaying(false);
          return durationSeconds;
        }
        return next;
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return stopLoop;
  }, [isPlaying, durationSeconds, stopLoop]);

  const play = useCallback(() => {
    if (durationSeconds <= 0) return;
    setCurrentTime((prev) => (prev >= durationSeconds ? 0 : prev));
    setIsPlaying(true);
  }, [durationSeconds]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const toggle = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) return false;
      if (durationSeconds <= 0) return false;
      setCurrentTime((time) => (time >= durationSeconds ? 0 : time));
      return true;
    });
  }, [durationSeconds]);

  const seek = useCallback(
    (time: number) => {
      const clamped = Math.min(Math.max(0, time), durationSeconds);
      setCurrentTime(clamped);
    },
    [durationSeconds]
  );

  const skip = useCallback(
    (deltaSeconds: number) => {
      seek(currentTime + deltaSeconds);
    },
    [currentTime, seek]
  );

  return { currentTime, isPlaying, volume, setVolume, play, pause, toggle, seek, skip };
}
