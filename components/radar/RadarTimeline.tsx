"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TimelineFrame = { timestamp: string; kind: "past" | "forecast" };

export function RadarTimeline({
  frames,
  index,
  playing,
  onIndexChange,
  onTogglePlay,
}: {
  frames: TimelineFrame[];
  index: number;
  playing: boolean;
  onIndexChange: (i: number) => void;
  onTogglePlay: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasPlayingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    timerRef.current = setInterval(() => {
      onIndexChange((index + 1) % frames.length);
    }, 600);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, index, frames.length, onIndexChange]);

  // Pause autoplay while a finger is on the thumb so the displayed frame
  // always matches where it's dragged to, then resume if it was running.
  const handleDragStart = useCallback(() => {
    wasPlayingRef.current = playing;
    if (playing) onTogglePlay();
    setDragging(true);
  }, [playing, onTogglePlay]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    if (wasPlayingRef.current) onTogglePlay();
  }, [onTogglePlay]);

  const firstForecastIndex = frames.findIndex((f) => f.kind === "forecast");
  const nowIndex =
    firstForecastIndex === -1
      ? Math.max(0, frames.length - 1)
      : Math.max(0, firstForecastIndex - 1);

  const handleJumpToNow = useCallback(() => {
    if (playing) onTogglePlay();
    onIndexChange(nowIndex);
  }, [playing, onTogglePlay, onIndexChange, nowIndex]);

  if (frames.length === 0) return null;

  const current = frames[index];
  const time = new Date(current.timestamp);
  const label = time.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const splitPct =
    firstForecastIndex === -1
      ? 100
      : (firstForecastIndex / (frames.length - 1)) * 100;
  const atNow = index === nowIndex;

  return (
    <div className="absolute inset-x-3 bottom-[max(6rem,calc(env(safe-area-inset-bottom)+5.5rem))] z-10 rounded-3xl border border-border-subtle bg-[#13151c]/95 px-4 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mb-2.5 flex items-center justify-between text-xs">
        <span className="font-medium text-white/55">
          {current.kind === "forecast" ? "Předpověď (nowcast)" : "Záznam"}
        </span>
        <div className="flex items-center gap-2">
          {!atNow && (
            <button
              type="button"
              onClick={handleJumpToNow}
              className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-[11px] text-white/80 backdrop-blur-md transition-colors active:bg-white/20"
            >
              Nyní
            </button>
          )}
          <span
            className={`font-medium tabular-nums text-white transition-transform ${
              dragging ? "scale-110" : ""
            }`}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-md transition-transform active:scale-90"
          aria-label={playing ? "Pozastavit" : "Přehrát"}
        >
          {/* biome-ignore lint/a11y/noSvgWithoutTitle: button already has aria-label */}
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            {playing ? (
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            ) : (
              <path d="M7 4.5v15l13-7.5z" />
            )}
          </svg>
        </button>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/40"
              style={{ width: `${splitPct}%` }}
            />
          </div>
          {firstForecastIndex !== -1 && (
            <button
              type="button"
              onClick={handleJumpToNow}
              aria-label="Skočit na nyní"
              className="absolute top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${(nowIndex / (frames.length - 1)) * 100}%` }}
            >
              <span className="block h-2.5 w-2.5 rounded-full border border-white/70 bg-white/30" />
            </button>
          )}
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={index}
            onChange={(e) => onIndexChange(Number(e.target.value))}
            onPointerDown={handleDragStart}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            className="radar-slider relative w-full"
            aria-label="Časový posun radaru"
          />
        </div>
      </div>
    </div>
  );
}
