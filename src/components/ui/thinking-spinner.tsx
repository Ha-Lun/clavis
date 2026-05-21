"use client";

import { cn } from "@/lib/utils";

interface ThinkingSpinnerProps {
  className?: string;
  size?: string;
}

export function ThinkingSpinner({ className, size = "1.25em" }: ThinkingSpinnerProps) {
  return (
    <>
      <style>{`
        @keyframes spin-triangle {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-dot-spinner {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
      `}</style>
      <svg
        viewBox="0 0 20 20"
        className={cn("shrink-0", className)}
        style={{ width: size, height: size }}
      >
        <g style={{ animation: "spin-triangle 1.6s linear infinite", transformOrigin: "10px 10px" }}>
          <circle cx="10" cy="3" r="2" fill="currentColor" style={{ animation: "pulse-dot-spinner 1.6s ease-in-out infinite 0s" }} />
          <circle cx="15.66" cy="13" r="2" fill="currentColor" style={{ animation: "pulse-dot-spinner 1.6s ease-in-out infinite 0.4s" }} />
          <circle cx="4.34" cy="13" r="2" fill="currentColor" style={{ animation: "pulse-dot-spinner 1.6s ease-in-out infinite 0.8s" }} />
        </g>
      </svg>
    </>
  );
}
