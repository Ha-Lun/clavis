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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import { Loader2, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionModal } from "@/components/subscription-modal";
import { DowngradeModal } from "@/components/downgrade-modal";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);
  const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro">("free");
  const [showSubModal, setShowSubModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
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
          setPreferredName(data.prefs?.preferredName ?? "");
          setShowReasoning(data.prefs?.showReasoning ?? false);
          setSubscriptionTier(data.prefs?.subscriptionTier ?? "free");
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
        body: JSON.stringify({ name: displayName, prefs: { defaultModel, preferredName, showReasoning, subscriptionTier } }),
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        window.location.reload();
      }, 1000);
    } catch {
      // Handle error silently
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

            {/* Preferred name */}
            <div className="space-y-2">
              <Label htmlFor="settings-preferred-name" className="text-[13px] font-medium text-foreground">
                Preferred Name
              </Label>
              <p className="text-[12px] text-muted-foreground font-light mb-2">
                What the AI should call you
              </p>
              <Input
                id="settings-preferred-name"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="What should the AI call you?"
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
                onValueChange={(value) => {
                  const selectedModelInfo = MODELS.find((m) => m.id === value);
                  if (selectedModelInfo?.isPremium && subscriptionTier !== "pro") {
                    setShowSubModal(true);
                    return;
                  }
                  setDefaultModel(value as typeof defaultModel);
                }}
              >
                <SelectTrigger
                  id="settings-default-model"
                  className="w-full h-10 bg-background border-border text-foreground text-[14px] rounded-md focus:ring-1 focus:ring-primary/40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className={cn(
                    "bg-[#0a0a0f]/95 border border-neutral-800/60 backdrop-blur-xl",
                    "w-[280px] sm:w-[480px] max-h-[520px] rounded-xl shadow-2xl shadow-black/80 animate-in fade-in-50 duration-200",
                    "overflow-hidden p-0"
                  )}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_0.9fr] divide-y sm:divide-y-0 sm:divide-x divide-neutral-800/50">
                    {/* Standard Models Column */}
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-semibold text-neutral-400/60 tracking-wider uppercase px-2.5 py-1.5 mb-1">
                        Standard Models
                      </div>
                      <div className="space-y-0.5">
                        {MODELS.filter((m) => !m.isPremium).map((m) => (
                          <SelectItem
                            key={m.id}
                            value={m.id}
                            className="text-foreground text-[12px] font-light pl-8 pr-2.5 py-1.5 rounded-md hover:bg-white/[0.04] focus:bg-white/[0.04] cursor-pointer"
                          >
                            {m.name}
                          </SelectItem>
                        ))}
                      </div>
                    </div>

                    {/* Premium Models Column */}
                    <div className="p-2 bg-gradient-to-b from-[#c9a84c]/[0.02] to-transparent space-y-1">
                      <div className="text-[10px] font-semibold text-[#c9a84c] tracking-wider uppercase px-2.5 py-1.5 mb-1 flex items-center justify-between">
                        <span>Premium Models</span>
                        <span className="text-[8px] bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 rounded px-1.5 py-0.5 font-normal uppercase tracking-normal">
                          Pro
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {MODELS.filter((m) => m.isPremium).map((m) => {
                          const isLocked = subscriptionTier !== "pro";
                          return (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              className={cn(
                                "text-foreground text-[12px] font-light pl-8 pr-2.5 py-1.5 rounded-md transition-colors w-full cursor-pointer flex items-center justify-between",
                                isLocked 
                                  ? "text-muted-foreground/45 hover:bg-white/[0.04] focus:bg-white/[0.04]" 
                                  : "hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-foreground"
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{m.name}</span>
                                {isLocked && (
                                  <Lock className="size-3 ml-2 text-muted-foreground/30" />
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-background">
              <div className="space-y-0.5">
                <Label htmlFor="settings-show-reasoning" className="text-[13px] font-medium text-foreground">
                  Show Reasoning
                </Label>
                <p className="text-[12px] text-muted-foreground font-light">
                  Display the AI's internal reasoning process if available
                </p>
              </div>
              <Switch
                id="settings-show-reasoning"
                checked={showReasoning}
                onCheckedChange={setShowReasoning}
              />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Subscription */}
          <div className="space-y-1 pb-2">
            <h2 className="text-[12px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              Subscription
            </h2>
          </div>

          <div className="space-y-5 p-5 rounded-lg border border-border bg-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-[13px] font-medium text-foreground">
                  Current Plan
                </Label>
                <div className="flex items-center gap-2 mt-1 mb-1">
                  <span className={cn(
                    "text-[12px] font-medium px-2 py-0.5 rounded-md",
                    subscriptionTier === "pro" 
                      ? "bg-primary/20 text-primary border border-primary/30" 
                      : "bg-secondary text-muted-foreground border border-border"
                  )}>
                    {subscriptionTier === "pro" ? "Pro Tier" : "Free Tier"}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground font-light mt-1">
                  {subscriptionTier === "pro" 
                    ? "You have unlimited uploads and access to premium models."
                    : "Upgrade to Pro for unlimited uploads and premium models."}
                </p>
              </div>
              <Button
                variant={subscriptionTier === "pro" ? "outline" : "default"}
                className={cn(
                  "h-9 px-4 text-[13px] font-medium rounded-md cursor-pointer",
                  subscriptionTier === "pro" 
                    ? "bg-transparent text-foreground border-border hover:bg-secondary hover:text-foreground" 
                    : "bg-primary text-white hover:bg-primary/90 shadow-glow"
                )}
                onClick={() => {
                  if (subscriptionTier !== "pro") {
                    setShowSubModal(true);
                  } else {
                    setShowDowngradeModal(true);
                  }
                }}
              >
                {subscriptionTier === "pro" ? "Cancel Subscription" : "Upgrade to Pro"}
              </Button>
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
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Saving…
                  </>
                ) : saved ? (
                  <>
                    <Check className="mr-2 size-3.5 text-green-400" />
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
      
      <SubscriptionModal 
        isOpen={showSubModal} 
        onClose={() => setShowSubModal(false)} 
      />

      <DowngradeModal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        onConfirm={() => setSubscriptionTier("free")}
      />
    </div>
  );
}
