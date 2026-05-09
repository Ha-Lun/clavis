"use client";

interface ThinkingIndicatorProps {
  modelId: string;
}

export function ThinkingIndicator({ modelId: _modelId }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 py-2 px-1 text-primary">
      <style>{`
        @keyframes spin-triangle {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
      `}</style>
      <svg
        viewBox="0 0 20 20"
        style={{ width: "1.25em", height: "1.25em" }}
        className="shrink-0"
      >
        <g style={{ animation: "spin-triangle 1.6s linear infinite", transformOrigin: "10px 10px" }}>
          <circle cx="10" cy="3" r="2" fill="currentColor" style={{ animation: "pulse-dot 1.6s ease-in-out infinite 0s" }} />
          <circle cx="15.66" cy="13" r="2" fill="currentColor" style={{ animation: "pulse-dot 1.6s ease-in-out infinite 0.4s" }} />
          <circle cx="4.34" cy="13" r="2" fill="currentColor" style={{ animation: "pulse-dot 1.6s ease-in-out infinite 0.8s" }} />
        </g>
      </svg>
      <span className="text-[12px] font-medium tracking-wide opacity-80 mt-px">
        Thinking…
      </span>
    </div>
  );
}