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
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [showReasoning, setShowReasoning] = useState(false);
  const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");

  const [canvasUrl, setCanvasUrl] = useState("");
  const [canvasToken, setCanvasToken] = useState("");
  const [showCanvasToken, setShowCanvasToken] = useState(false);
  const [testingCanvas, setTestingCanvas] = useState(false);
  const [canvasTestResult, setCanvasTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [calendarIcsUrl, setCalendarIcsUrl] = useState("");
  const [testingCalendar, setTestingCalendar] = useState(false);
  const [calendarTestResult, setCalendarTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
          setCanvasUrl(data.prefs?.canvasUrl ?? "");
          setCanvasToken(data.prefs?.canvasToken ?? "");
          setCalendarIcsUrl(data.prefs?.calendarIcsUrl ?? "");
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
        body: JSON.stringify({
          name: displayName,
          prefs: {
            defaultModel,
            preferredName,
            showReasoning,
            canvasUrl,
            canvasToken,
            calendarIcsUrl,
          },
        }),
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

  const handleTestIntegration = async (type: "canvas" | "calendar") => {
    if (type === "canvas") {
      setTestingCanvas(true);
      setCanvasTestResult(null);
    } else {
      setTestingCalendar(true);
      setCalendarTestResult(null);
    }

    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...(type === "canvas" ? { canvasUrl, canvasToken } : { calendarIcsUrl }),
        }),
      });
      const data = await res.json();
      
      if (type === "canvas") {
        setCanvasTestResult({ success: data.success, message: data.message });
      } else {
        setCalendarTestResult({ success: data.success, message: data.message });
      }
    } catch (err) {
      if (type === "canvas") {
        setCanvasTestResult({ success: false, message: "Network error occurred." });
      } else {
        setCalendarTestResult({ success: false, message: "Network error occurred." });
      }
    } finally {
      if (type === "canvas") {
        setTestingCanvas(false);
      } else {
        setTestingCalendar(false);
      }
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
                onValueChange={(value) => setDefaultModel(value as typeof defaultModel)}
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
                  <div className="p-2 space-y-1">
                    {MODELS.map((m) => (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        className="text-foreground text-[12px] font-light pl-8 pr-2.5 py-1.5 rounded-md hover:bg-white/[0.04] focus:bg-white/[0.04] cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{m.name}</span>
                        </div>
                      </SelectItem>
                    ))}
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

          {/* Academic & Schedule Integrations */}
          <div className="space-y-1 pb-2">
            <h2 className="text-[12px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              Academic & Schedule Integrations
            </h2>
            <p className="text-[12px] text-muted-foreground font-light pt-1">
              Connect your university Canvas/Studium LMS and personal calendar feed to enable AI schedule & course assistance
            </p>
          </div>

          <div className="space-y-5 p-5 rounded-lg border border-border bg-card">
            {/* Canvas URL */}
            <div className="space-y-2">
              <Label htmlFor="settings-canvas-url" className="text-[13px] font-medium text-foreground">
                Canvas / Studium URL
              </Label>
              <p className="text-[12px] text-muted-foreground font-light mb-2 leading-relaxed">
                Open your university portal and copy the base domain URL (e.g. <code>https://studium.uu.se</code>) without any trailing paths.
              </p>
              <Input
                id="settings-canvas-url"
                value={canvasUrl}
                onChange={(e) => setCanvasUrl(e.target.value)}
                placeholder="https://studium.uu.se or https://canvas.instructure.com"
                className={cn(
                  "h-10 bg-background border-border text-foreground text-[14px] font-light rounded-md",
                  "focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
                )}
              />
            </div>

            {/* Canvas Token */}
            <div className="space-y-2">
              <Label htmlFor="settings-canvas-token" className="text-[13px] font-medium text-foreground">
                Canvas Personal Access Token
              </Label>
              <div className="text-[12px] text-muted-foreground font-light leading-relaxed space-y-1 mb-3 mt-1">
                <p>1. Log in to Canvas and click <strong>Account</strong> in the left global navigation.</p>
                <p>2. Click <strong>Settings</strong>.</p>
                <p>3. Scroll down to <strong>Approved Integrations</strong>.</p>
                <p>4. Click <strong>+ New Access Token</strong>.</p>
                <p>5. Set Purpose to "Clavis" and set an optional Expiry date.</p>
                <p>6. Click <strong>Generate Token</strong>.</p>
                <p className="text-primary font-medium">7. IMMEDIATELY copy the token string before closing because Canvas will never display it again.</p>
                <p>8. Paste the token below.</p>
              </div>
              <div className="relative">
                <Input
                  id="settings-canvas-token"
                  type={showCanvasToken ? "text" : "password"}
                  value={canvasToken}
                  onChange={(e) => setCanvasToken(e.target.value)}
                  placeholder="Token"
                  className={cn(
                    "h-10 bg-background border-border text-foreground text-[14px] font-light rounded-md pr-10",
                    "focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowCanvasToken(!showCanvasToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCanvasToken ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <Button
                  onClick={() => handleTestIntegration("canvas")}
                  disabled={testingCanvas || !canvasUrl || !canvasToken}
                  variant="outline"
                  className="h-8 text-[12px] bg-transparent border-border hover:bg-white/[0.04] text-foreground"
                >
                  {testingCanvas && <Loader2 className="mr-2 size-3 animate-spin" />}
                  Test Canvas Connection
                </Button>
                {canvasTestResult && (
                  <span className={cn(
                    "text-[12px] flex items-center gap-1.5",
                    canvasTestResult.success ? "text-green-400" : "text-destructive"
                  )}>
                    {canvasTestResult.success ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    )}
                    {canvasTestResult.message}
                  </span>
                )}
              </div>
            </div>

            <Separator className="bg-border/50 my-4" />

            {/* Calendar URL */}
            <div className="space-y-2">
              <Label htmlFor="settings-calendar-url" className="text-[13px] font-medium text-foreground">
                Calendar (.ics) Feed URL
              </Label>
              <p className="text-[12px] text-muted-foreground font-light mb-2">
                Canvas: Calendar → Calendar Feed link
              </p>
              <Input
                id="settings-calendar-url"
                value={calendarIcsUrl}
                onChange={(e) => setCalendarIcsUrl(e.target.value)}
                placeholder="https://... or webcal://..."
                className={cn(
                  "h-10 bg-background border-border text-foreground text-[14px] font-light rounded-md",
                  "focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
                )}
              />
              <div className="pt-2 flex items-center gap-3">
                <Button
                  onClick={() => handleTestIntegration("calendar")}
                  disabled={testingCalendar || !calendarIcsUrl}
                  variant="outline"
                  className="h-8 text-[12px] bg-transparent border-border hover:bg-white/[0.04] text-foreground"
                >
                  {testingCalendar && <Loader2 className="mr-2 size-3 animate-spin" />}
                  Test Calendar Connection
                </Button>
                {calendarTestResult && (
                  <span className={cn(
                    "text-[12px] flex items-center gap-1.5",
                    calendarTestResult.success ? "text-green-400" : "text-destructive"
                  )}>
                    {calendarTestResult.success ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    )}
                    {calendarTestResult.message}
                  </span>
                )}
              </div>
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
    </div>
  );
}