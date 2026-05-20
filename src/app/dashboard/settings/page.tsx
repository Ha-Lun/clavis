"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setEmail(data.email ?? "");
          setDisplayName(data.name ?? data.email?.split("@")[0] ?? "");
          setDefaultModel(data.prefs?.defaultModel ?? DEFAULT_MODEL);
        }
      } catch {
        // Silently fail
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, prefs: { defaultModel } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-xl mx-auto px-6 py-10 lg:py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h1 className="text-[28px] font-light tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground font-light">
            Manage your account preferences
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Profile section */}
          <div className="space-y-1 pb-2">
            <h2 className="text-[12px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              Profile
            </h2>
          </div>

          <div className="space-y-5 p-5 rounded-lg border border-border bg-card">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-[13px] font-medium text-muted-foreground">
                Email
              </Label>
              <Input
                id="settings-email"
                value={email}
                disabled
                className="h-10 bg-secondary/50 border-border text-muted-foreground text-[14px] font-light rounded-md"
              />
            </div>

            {/* Display name */}
            <div className="space-y-2">
              <Label htmlFor="settings-display-name" className="text-[13px] font-medium text-foreground">
                Display Name
              </Label>
              <Input
                id="settings-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className={cn(
                  "h-10 bg-background border-border text-foreground text-[14px] font-light rounded-md",
                  "focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
                )}
              />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* AI preferences */}
          <div className="space-y-1 pb-2">
            <h2 className="text-[12px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              AI Preferences
            </h2>
          </div>

          <div className="space-y-5 p-5 rounded-lg border border-border bg-card">
            <div className="space-y-2">
              <Label htmlFor="settings-default-model" className="text-[13px] font-medium text-foreground">
                Default Model
              </Label>
              <p className="text-[12px] text-muted-foreground font-light">
                Selected by default when creating new chats
              </p>
              <Select
                value={defaultModel}
                onValueChange={(value) => setDefaultModel(value as typeof defaultModel)}
              >
                <SelectTrigger
                  id="settings-default-model"
                  className="w-full h-10 bg-background border-border text-foreground text-[14px] rounded-md focus:ring-1 focus:ring-primary/40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-lg">
                  {MODELS.map((m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className="text-foreground text-[13px] font-light hover:bg-white/[0.04] focus:bg-white/[0.04] cursor-pointer rounded-md"
                    >
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-2">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleSave}
                disabled={loading}
                className={cn(
                  "h-9 px-5 text-[13px] font-medium rounded-md transition-all duration-200",
                  "bg-primary text-white hover:bg-primary/90 cursor-pointer"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : saved ? (
                  <>
                    <Check className="mr-2 h-3.5 w-3.5 text-green-400" />
                    Saved
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
