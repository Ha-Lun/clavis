"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center rounded-md",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-white/[0.05] transition-colors cursor-pointer",
        "size-7",
        className
      )}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.2 }}
          >
            <Moon className="size-3.5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: -90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.2 }}
          >
            <Sun className="size-3.5" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
