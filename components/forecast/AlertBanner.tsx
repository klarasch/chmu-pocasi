type Alert = {
  identifier: string;
  event: string;
  severity: string;
  areas: string[];
};

const SEVERITY_COLOR: Record<string, string> = {
  Moderate: "#f5c344",
  Severe: "#f5934a",
  Extreme: "#ef4b4b",
};

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => {
        const color = SEVERITY_COLOR[a.severity] ?? SEVERITY_COLOR.Moderate;
        return (
          <div
            key={a.identifier}
            className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface py-3 pl-3.5 pr-4"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative, event name is adjacent */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth="1.8"
              aria-hidden
            >
              <path
                d="M12 9v4.5M12 16.5h.01M10.6 3.9 2.9 17.5a1.6 1.6 0 0 0 1.4 2.4h15.4a1.6 1.6 0 0 0 1.4-2.4L13.4 3.9a1.6 1.6 0 0 0-2.8 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium">{a.event}</span>
          </div>
        );
      })}
    </div>
  );
}
