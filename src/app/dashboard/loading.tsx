export default function DashboardLoading() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block size-1.5 rounded-full bg-muted-foreground/30"
            style={{
              animation: "thinking-dot 1.2s ease-in-out infinite",
              animationDelay: `${i * 180}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}