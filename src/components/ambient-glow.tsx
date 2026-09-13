import { AmbientParticles } from "./ambient-particles";

export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Gradients */}
      <div 
        className="absolute inset-0 dark:opacity-[0.8]" 
        style={{ 
          background: `
            radial-gradient(ellipse 70% 45% at 50% 0%, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.04) 35%, transparent 70%),
            radial-gradient(ellipse 70% 45% at 50% 100%, hsl(var(--primary) / 0.08) 0%, hsl(var(--primary) / 0.03) 35%, transparent 70%),
            radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.03) 0%, transparent 60%)
          `
        }} 
      />
      <AmbientParticles />
    </div>
  );
}

