"use client";

interface ThinkingIndicatorProps {
  modelId: string;
}

export function ThinkingIndicator({ modelId }: ThinkingIndicatorProps) {
  return (
    <div className="animate-fade-in flex items-center gap-3 py-4 px-1" style={{ minHeight: "60px" }}>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-2 w-2 rounded-full"
            style={{
              backgroundColor: "#c9a84c",
              animation: "fluxRipple 0.8s ease-in-out infinite",
              animationDelay: `${i * 120}ms`,
              boxShadow: "0 0 8px rgba(201, 168, 76, 0.4)",
            }}
          />
        ))}
      </div>
      <span
        className="text-[13px] font-medium tracking-wide"
        style={{ color: "#c9a84c" }}
      >
        Flux is thinking...
      </span>

      <style jsx>{`
        @keyframes fluxRipple {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}