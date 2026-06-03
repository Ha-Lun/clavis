"use client";

import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Menu, Plus } from "lucide-react";
import Link from "next/link";

export function MobileNav() {
  const { toggleSidebar } = useUIStore();

  return (
    <div className="lg:hidden flex items-center justify-between h-12 px-4 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          id="mobile-menu-button"
          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Menu className="size-4" />
        </Button>
        <span className="font-cinzel text-[14px] font-normal tracking-[0.05em] text-foreground">Clavis</span>
      </div>
      <Link href="/dashboard/chat/new" className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="New Chat">
        <Plus className="size-4" />
      </Link>
    </div>
  );
}
