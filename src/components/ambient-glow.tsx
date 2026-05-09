export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Gradients */}
      <div 
        className="absolute inset-0 dark:opacity-[0.8]" 
        style={{ 
          background: `
            radial-gradient(circle at 85% -5%, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.06) 20%, hsl(var(--primary) / 0.02) 40%, hsl(var(--primary) / 0) 60%),
            radial-gradient(circle at -5% 85%, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.06) 20%, hsl(var(--primary) / 0.02) 40%, hsl(var(--primary) / 0) 60%)
          `
        }} 
      />
    </div>
  );
}
