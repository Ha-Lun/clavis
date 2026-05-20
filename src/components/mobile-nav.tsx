"use client";

import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function MobileNav() {
  const { toggleSidebar } = useUIStore();

  return (
    <div className="lg:hidden flex items-center gap-3 h-12 px-4 border-b border-border bg-background shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        id="mobile-menu-button"
        className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <Menu className="h-4 w-4" />
      </Button>
      <span className="font-cinzel text-[14px] font-normal tracking-[0.05em] text-foreground">Clavis</span>
    </div>
  );
}
