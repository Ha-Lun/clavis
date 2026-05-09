"use client"

import React from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";

  // Routes where the sidebar should be hidden (auth, landing, full-bleed pages)
  const excluded = ["/login", "/register", "/auth", "/signup", "/"];

  const shouldHide = excluded.some((p) => {
    if (p === "/") {
      // keep root out of the full app area if desired — only hide on exact root
      return pathname === p;
    }
    return pathname === p || pathname.startsWith(p + "/");
  });

  if (shouldHide) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
