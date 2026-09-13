"use client";

import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useRouter } from "next/navigation";

export function CapacitorDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      if (Capacitor.getPlatform() === 'android') {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      }
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#0a0a0f' }).catch(() => {});

      const listener = CapacitorApp.addListener("appUrlOpen", async (data) => {
        if (data.url.startsWith("clavis://oauth")) {
          // e.g. clavis://oauth?ticket=...
          try {
            await Browser.close();
          } catch (e) {
            // ignore
          }
          
          try {
            const urlObj = new URL(data.url);
            
            if (urlObj.protocol === "clavis:" && urlObj.host === "oauth") {
              const ticket = urlObj.searchParams.get("ticket");

              if (ticket) {
                await fetch("/api/auth/session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ticket }),
                });
                router.push("/dashboard");
              }
            }
          } catch (e) {
            // ignore URL parsing errors
          }
        }
      });

      return () => {
        listener.then((l) => l.remove());
      };
    }
  }, [router]);

  return null;
}
