const STOPS = [
  { dbz: "0–20", color: "#7fd8ff", label: "slabý" },
  { dbz: "20–35", color: "#3fa9f5", label: "mírný" },
  { dbz: "35–45", color: "#f5d33f", label: "silný" },
  { dbz: "45–55", color: "#f57f3f", label: "velmi silný" },
  { dbz: "55+", color: "#e0383f", label: "extrémní" },
];

export function RadarLegend() {
  return (
    <div className="pointer-events-none absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 rounded-2xl border border-[#cfcdc6] bg-[#ecebe6]/95 px-3.5 py-3 text-xs text-[#16161a] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.15)] backdrop-blur-xl">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#6b6b70]">
        Intenzita srážek
      </div>
      <div className="flex flex-col gap-1.5">
        {STOPS.map((s) => (
          <div key={s.dbz} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-[#16161a]/80 font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
