"use client";

import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  modelId: string;
}

function getModelThinking(modelId: string): {
  label: string;
  color: string;
  animation: React.ReactNode;
} {
  if (modelId.includes("deepseek")) {
    return {
      label: "DeepSeek is thinking...",
      color: "#06b6d4",
      animation: <DeepSeekAnimation />,
    };
  }
  if (modelId.includes("kimi") || modelId.includes("moonshot")) {
    return {
      label: "Kimi is thinking...",
      color: "#c4b5fd",
      animation: <KimiAnimation />,
    };
  }
  if (modelId.includes("minimax")) {
    return {
      label: "MiniMax is thinking...",
      color: "#a78bfa",
      animation: <MiniMaxAnimation />,
    };
  }
  if (modelId.includes("glm")) {
    return {
      label: "GLM is thinking...",
      color: "#c9a84c",
      animation: <GLMAnimation />,
    };
  }
  if (modelId.includes("nemotron") || modelId.includes("nvidia")) {
    return {
      label: "Nemotron is thinking...",
      color: "#22c55e",
      animation: <NemotronAnimation />,
    };
  }
  return {
    label: "Thinking...",
    color: "#c9a84c",
    animation: <DeepSeekAnimation />,
  };
}

/* ── DeepSeek: fast ripple dots ───────────────────────────── */
function DeepSeekAnimation() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: "#06b6d4",
            animation: "deepseekRipple 0.8s ease-in-out infinite",
            animationDelay: `${i * 120}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Kimi: rotating crescent moon ─────────────────────────── */
function KimiAnimation() {
  return (
    <div
      className="relative h-6 w-6"
      style={{ animation: "kimiSpin 3s linear infinite" }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 35%, transparent 40%, #c4b5fd 42%, #c4b5fd 58%, transparent 60%)",
          filter: "drop-shadow(0 0 6px rgba(196, 181, 253, 0.6))",
        }}
      />
    </div>
  );
}

/* ── MiniMax: 2x2 pulsing grid ────────────────────────────── */
function MiniMaxAnimation() {
  return (
    <div className="grid grid-cols-2 gap-1">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="block h-2.5 w-2.5 rounded-sm"
          style={{
            backgroundColor: i % 2 === 0 ? "#a78bfa" : "#f5f0ff",
            animation: "minimaxPulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 200}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ── GLM: ink brush stroke ────────────────────────────────── */
function GLMAnimation() {
  return (
    <svg
      width="32"
      height="16"
      viewBox="0 0 32 16"
      fill="none"
      className="overflow-visible"
    >
      <path
        d="M2 14 C8 2, 14 2, 16 8 C18 14, 24 14, 30 2"
        stroke="#c9a84c"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: 60,
          strokeDashoffset: 0,
          animation: "glmBrush 2.5s ease-in-out infinite",
          filter: "drop-shadow(0 0 4px rgba(201, 168, 76, 0.5))",
        }}
      />
    </svg>
  );
}

/* ── Nemotron: pulsing circuit nodes ──────────────────────── */
function NemotronAnimation() {
  return (
    <div className="relative h-6 w-8 flex items-center justify-center">
      {/* Center node */}
      <span
        className="absolute h-3 w-3 rounded-full"
        style={{
          backgroundColor: "#22c55e",
          animation: "nemotronPulse 1.5s ease-out infinite",
          boxShadow: "0 0 8px rgba(34, 197, 94, 0.6)",
        }}
      />
      {/* Ring 1 */}
      <span
        className="absolute h-5 w-5 rounded-full border"
        style={{
          borderColor: "#22c55e",
          opacity: 0,
          animation: "nemotronRing 1.5s ease-out infinite",
        }}
      />
      {/* Ring 2 */}
      <span
        className="absolute h-7 w-7 rounded-full border"
        style={{
          borderColor: "#22c55e",
          opacity: 0,
          animation: "nemotronRing 1.5s ease-out infinite 0.5s",
        }}
      />
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export function ThinkingIndicator({ modelId }: ThinkingIndicatorProps) {
  const { label, color, animation } = getModelThinking(modelId);

  return (
    <div className="animate-fade-in flex items-center gap-3 py-4 px-1" style={{ minHeight: "60px" }}>
      {animation}
      <span
        className="text-sm font-light tracking-wide"
        style={{ color, fontFamily: "var(--font-cormorant), serif" }}
      >
        {label}
      </span>

      {/* Keyframe styles */}
      <style jsx>{`
        @keyframes deepseekRipple {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes kimiSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes minimaxPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes glmBrush {
          0% { stroke-dashoffset: 60; opacity: 0.3; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -60; opacity: 0.3; }
        }
        @keyframes nemotronPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes nemotronRing {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
