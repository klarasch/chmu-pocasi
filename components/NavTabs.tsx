"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function ForecastIcon() {
  return (
    <span className="flex flex-col gap-[2.5px] w-[13px] shrink-0">
      <span className="h-[2px] bg-current rounded-[1px] w-full" />
      <span className="h-[2px] bg-current rounded-[1px] w-full" />
      <span className="h-[2px] bg-current rounded-[1px] w-[8px]" />
    </span>
  );
}

function RadarIcon() {
  return (
    <span className="relative w-[13px] h-[13px] shrink-0">
      <span className="absolute inset-0 border-[1.5px] border-current rounded-full" />
      <span className="absolute inset-[3.5px] border-[1.5px] border-current rounded-full" />
      <span className="absolute left-[5px] top-[5px] w-[3px] h-[3px] bg-current rounded-full" />
    </span>
  );
}

export function NavTabs() {
  const pathname = usePathname();

  const isForecast = pathname === "/";
  const isRadar = pathname === "/radar";

  const btnStyle = (active: boolean) =>
    `border-none cursor-pointer font-sans text-[13px] font-semibold tracking-[0.02em] py-[9px] px-[20px] rounded-[30px] flex items-center gap-[7px] transition-all duration-150 active:scale-95 ${
      active
        ? "bg-[rgba(255,255,255,0.82)] text-[#16161a] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.22)]"
        : "bg-transparent text-[rgba(40,40,44,0.55)] hover:text-[rgba(40,40,44,0.8)]"
    }`;

  return (
    <nav
      className="fixed inset-x-0 z-50 flex justify-center pointer-events-none"
      style={{ bottom: "var(--nav-tabs-bottom)" }}
    >
      <div
        className="pointer-events-auto flex gap-[3px] p-[5px] rounded-[40px] bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.65)] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.85),inset_0_-8px_16px_-10px_rgba(120,120,140,0.3)]"
        style={{
          backdropFilter: "blur(20px) saturate(1.8)",
          WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        }}
      >
        <Link href="/" className={btnStyle(isForecast)}>
          <ForecastIcon />
          Předpověď
        </Link>
        <Link href="/radar" className={btnStyle(isRadar)}>
          <RadarIcon />
          Radar
        </Link>
      </div>
    </nav>
  );
}
