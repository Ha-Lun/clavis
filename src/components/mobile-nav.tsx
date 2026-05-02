"use client";

import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function MobileNav() {
  const { toggleSidebar } = useUIStore();

  return (
    <div className="lg:hidden flex items-center gap-2 p-3 border-b border-border">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        id="mobile-menu-button"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <span className="text-sm font-semibold text-primary">Flux</span>
    </div>
  );
}
