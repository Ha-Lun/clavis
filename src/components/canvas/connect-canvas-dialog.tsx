"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, GraduationCap, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ConnectCanvasDialog({ 
  children, 
  onSuccess 
}: { 
  children: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "canvas", canvasUrl: url, canvasToken: token })
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message });
    } catch (err) {
      setTestResult({ success: false, message: "Network error occurred." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: { canvasUrl: url, canvasToken: token } })
      });
      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (err) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 bg-card border-border overflow-hidden gap-0 rounded-2xl shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-border bg-background/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-medium tracking-tight">
              <GraduationCap className="size-5 text-primary" />
              Connect Studium/Canvas
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground mt-2 font-light leading-relaxed">
            Link your university account to enable AI course assistance. Follow the steps below carefully.
          </p>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto scrollbar-thin space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-[13px] font-medium text-foreground mb-1">Step 1: Get your Canvas URL</h3>
              <p className="text-[12px] text-muted-foreground mb-3 font-light leading-relaxed">
                Open your university portal and copy the base domain URL (e.g. <code>https://studium.uu.se</code>) without any trailing paths.
              </p>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://studium.uu.se"
                className="h-10 bg-background border-border text-[13px] focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
              />
            </div>

            <div>
              <h3 className="text-[13px] font-medium text-foreground mb-1">Step 2: Generate Access Token</h3>
              <div className="text-[12px] text-muted-foreground font-light leading-relaxed space-y-1.5 mb-3">
                <p>1. Log in to Canvas and click <strong>Account</strong> in the left global navigation.</p>
                <p>2. Click <strong>Settings</strong>.</p>
                <p>3. Scroll down to <strong>Approved Integrations</strong>.</p>
                <p>4. Click <strong>+ New Access Token</strong>.</p>
                <p>5. Set Purpose to "Clavis" and set an optional Expiry date.</p>
                <p>6. Click <strong>Generate Token</strong>.</p>
                <p className="text-primary font-medium">7. IMMEDIATELY copy the token string before closing because Canvas will never display it again.</p>
              </div>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your token here..."
                className="h-10 bg-background border-border text-[13px] focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40"
              />
            </div>
          </div>

          {testResult && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-3 rounded-lg border text-[13px] flex items-start gap-2",
                testResult.success 
                  ? "bg-green-500/10 border-green-500/20 text-green-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              )}
            >
              {testResult.success ? (
                <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
              ) : (
                <ExternalLink className="size-4 mt-0.5 shrink-0" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </motion.div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-background/50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !url || !token}
            className="h-9 text-[12px] bg-transparent border-border hover:bg-white/[0.04]"
          >
            {testing && <Loader2 className="mr-2 size-3 animate-spin" />}
            Test Connection
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !url || !token}
            className="h-9 text-[12px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
          >
            {saving && <Loader2 className="mr-2 size-3 animate-spin" />}
            Save Integration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
