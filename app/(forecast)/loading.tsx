export default function ForecastLoading() {
  return (
    <div className="flex flex-col animate-fade-in">
      <div className="flex flex-col items-center gap-3 px-4 pb-12 pt-[max(3rem,env(safe-area-inset-top))]">
        <div className="text-sm font-medium text-white/55">Praha</div>
        <div className="py-6 text-sm text-white/55">Načítání počasí…</div>
      </div>
      <main className="flex flex-col gap-4 px-4 pt-4 pb-32">
        <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-7 text-center text-xs text-white/55">
          Načítání hodinové předpovědi…
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-7 text-center text-xs text-white/55">
          Načítání předpovědi na 7 dní…
        </div>
      </main>
    </div>
  );
}
