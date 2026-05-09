export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
          style={{
            animation: "thinking-dot 1.2s ease-in-out infinite",
            animationDelay: `${i * 180}ms`,
          }}
        />
      ))}
    </div>
  );
}
