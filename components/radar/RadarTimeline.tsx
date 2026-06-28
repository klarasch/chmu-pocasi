"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TimelineFrame = { timestamp: string; kind: "past" | "forecast" };

const LEGEND_STOPS = [
  { color: "#7fd8ff", label: "slabý" },
  { color: "#3fa9f5", label: "mírný" },
  { color: "#f5d33f", label: "silný" },
  { color: "#f57f3f", label: "velmi silný" },
  { color: "#e0383f", label: "extrémní" },
];

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
  const pNow = nowIndex / (frames.length - 1);
  const nowLeft = `calc(${pNow * 100}% + ${(0.5 - pNow) * 22}px)`;
  const atNow = index === nowIndex;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 h-[290px]">
      {/* Frosted glass that grades from solid at the map's edge to fully
          transparent above the controls, instead of a floating card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          maskImage:
            "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#ecebe6] via-[#ecebe6]/65 to-transparent"
      />
      <div
        className="absolute inset-x-0 px-4 text-[#16161a]"
        style={{ bottom: "max(6rem, calc(var(--nav-tabs-bottom) + 44px))" }}
      >
        {/* Horizontal Legend */}
        <div className="mb-3.5 flex items-center justify-between border-b border-[#cfcdc6]/30 pb-2 text-[10px] font-semibold text-[#6b6b70] tracking-wide uppercase">
          <span className="text-[9px] font-bold text-[#6b6b70]/60">
            Intenzita srážek:
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {LEGEND_STOPS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 normal-case text-[#16161a]/85"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: s.color }}
                />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-2.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#6b6b70]">
            {current.kind === "forecast" ? "Předpověď (nowcast)" : "Záznam"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleJumpToNow}
              className={`rounded-full border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.4)] px-2.5 py-1 font-semibold text-[11px] text-[#16161a] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.85),inset_0_-8px_16px_-10px_rgba(120,120,140,0.3)] transition-all duration-150 active:scale-95 ${
                atNow
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100 pointer-events-auto"
              }`}
              style={{
                backdropFilter: "blur(20px) saturate(1.8)",
                WebkitBackdropFilter: "blur(20px) saturate(1.8)",
              }}
            >
              Nyní
            </button>
            <span
              className={`font-semibold tabular-nums text-[#16161a] transition-transform ${
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.4)] text-[#16161a] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.85),inset_0_-8px_16px_-10px_rgba(120,120,140,0.3)] transition-transform active:scale-90"
            style={{
              backdropFilter: "blur(20px) saturate(1.8)",
              WebkitBackdropFilter: "blur(20px) saturate(1.8)",
            }}
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
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#cfcdc6]/30">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#16161a]/30"
                style={{ width: nowLeft }}
              />
            </div>
            {firstForecastIndex !== -1 && (
              <button
                type="button"
                onClick={handleJumpToNow}
                aria-label="Skočit na nyní"
                className="absolute top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: nowLeft }}
              >
                <span className="block h-2.5 w-2.5 rounded-full border border-[#16161a]/70 bg-[#16161a]/30" />
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
    </div>
  );
}
