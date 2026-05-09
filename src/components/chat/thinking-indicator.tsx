"use client";

interface ThinkingIndicatorProps {
  modelId: string;
}

export function ThinkingIndicator({ modelId }: ThinkingIndicatorProps) {
  return (
    <div className="animate-fade-in flex items-center gap-3.5 py-5 px-1 select-none">
      <div className="flex items-center gap-2 bg-gold/10 border border-gold/25 px-4.5 py-2.5 rounded-full shadow-gold-glow">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: "#c9a84c",
                animation: "fluxRipple 1s ease-in-out infinite",
                animationDelay: `${i * 150}ms`,
                boxShadow: "0 0 6px rgba(201, 168, 76, 0.5)",
              }}
            />
          ))}
        </div>
        <span
          className="text-xs font-medium tracking-[0.15em] uppercase pl-2 text-gold-shimmer select-none"
        >
          Thinking
        </span>
      </div>

      <style jsx>{`
        @keyframes fluxRipple {
          0%, 100% { transform: scale(0.7); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}