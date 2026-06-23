"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WeatherIcon } from "@/components/icons/WeatherIcon";

// iOS standalone/fullscreen PWAs have no browser chrome, so there's no native
// swipe-to-reload gesture — this re-implements it by hand for the scrollable
// document. Only meaningful where the page itself scrolls (the forecast
// page); the radar page is a fixed-viewport map that already owns vertical
// drag gestures for panning, so this is a no-op there.
const PULL_THRESHOLD = 70;
const MAX_PULL = 110;
const RESISTANCE = 0.45;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const enabled = pathname !== "/radar";

  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // Defaults to day and corrects after mount, so the cloud/sun glyph never
  // disagrees between the server-rendered markup and the client (the
  // indicator is invisible at pull 0 anyway, so the one-frame switch is moot).
  const [isNight, setIsNight] = useState(false);
  const pullRef = useRef(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const directionLocked = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const hour = new Date().getUTCHours();
    setIsNight(hour < 6 || hour >= 21);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const setPullValue = (value: number) => {
      pullRef.current = value;
      setPull(value);
    };

    // A swipe that starts inside a horizontally-scrollable strip (e.g. the
    // hourly forecast) must always be treated as horizontal scrolling, never
    // as a pull-to-refresh gesture — even before any movement happens.
    function startsInHorizontalScroller(target: EventTarget | null) {
      if (!(target instanceof Element)) return false;
      const el = target.closest<HTMLElement>("[data-horizontal-scroll]");
      return !!el && el.scrollWidth > el.clientWidth;
    }

    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current) return;
      if ((document.scrollingElement?.scrollTop ?? 0) > 0) return;
      if (startsInHorizontalScroller(e.target)) {
        pulling.current = false;
        directionLocked.current = true;
        startX.current = null;
        startY.current = null;
        return;
      }
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
      directionLocked.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (
        !pulling.current ||
        startY.current === null ||
        startX.current === null
      )
        return;
      const deltaX = e.touches[0].clientX - startX.current;
      const deltaY = e.touches[0].clientY - startY.current;

      // Determine the gesture's dominant axis once, on the first
      // significant movement. If it's mostly horizontal, hand the gesture
      // over to native scrolling and never engage pull-to-refresh for it.
      if (!directionLocked.current) {
        if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
        directionLocked.current = true;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          pulling.current = false;
          setPullValue(0);
          return;
        }
      }

      const delta = deltaY;
      if (delta <= 0) {
        if (pullRef.current !== 0) setPullValue(0);
        return;
      }
      if ((document.scrollingElement?.scrollTop ?? 0) > 0) {
        pulling.current = false;
        setPullValue(0);
        return;
      }
      e.preventDefault();
      setPullValue(Math.min(MAX_PULL, delta * RESISTANCE));
    }

    function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      startX.current = null;
      startY.current = null;
      if (pullRef.current >= PULL_THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullValue(PULL_THRESHOLD * 0.6);
        router.refresh();
        setTimeout(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullValue(0);
        }, 600);
      } else {
        setPullValue(0);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, router]);

  if (!enabled) return <>{children}</>;

  const progress = Math.min(1, pull / PULL_THRESHOLD);
  const ready = pull >= PULL_THRESHOLD && !refreshing;
  const label = refreshing
    ? "Aktualizuji počasí…"
    : ready
      ? "Teď pusť"
      : "Potáhni pro nové počasí";

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col items-center gap-1.5"
        style={{
          opacity: pull > 4 ? 1 : 0,
          transform: `translateY(${Math.max(0, pull - 44)}px)`,
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          transition: pulling.current ? "none" : "opacity 0.15s ease",
        }}
        aria-hidden
      >
        <div
          className={refreshing ? "animate-ptr-bob" : undefined}
          style={{
            transform: `scale(${0.7 + (refreshing ? 1 : progress) * 0.3}) rotate(${refreshing ? 0 : progress * 10 - 5}deg)`,
            transition: pulling.current
              ? "none"
              : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <WeatherIcon
            condition="partly-cloudy"
            isNight={isNight}
            size={30}
            className="text-white drop-shadow-md"
          />
        </div>
        <div className="flex h-2 items-center gap-1">
          {refreshing &&
            [0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-1.5 w-1.5 rounded-full bg-accent animate-ptr-drop"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
        </div>
        <div
          className="text-[11px] font-medium tracking-wide text-white/75"
          style={{
            opacity: pull > 16 ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          transform: pull ? `translateY(${pull}px)` : undefined,
          transition: pulling.current ? "none" : "transform 0.2s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
