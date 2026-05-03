"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "h-9 w-9 rounded-[8px] transition-all duration-300",
        "text-muted-foreground hover:text-foreground hover:bg-secondary",
        className
      )}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="relative h-5 w-5">
        <Sun
          className={cn(
            "h-5 w-5 absolute inset-0 transition-all duration-500 transform",
            theme === "dark" ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "h-5 w-5 absolute inset-0 transition-all duration-500 transform",
            theme === "light" ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          )}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
