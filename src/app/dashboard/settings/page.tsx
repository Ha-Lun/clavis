"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MODELS, DEFAULT_MODEL } from "@/lib/models";
import { Settings, Loader2, Check } from "lucide-react";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [defaultModel, setDefaultModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Fetch user info from a lightweight endpoint
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
        body: JSON.stringify({
          name: displayName,
          prefs: { defaultModel },
        }),
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
    <div className="h-full overflow-y-auto scrollbar-thin p-6 lg:p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-12 w-12 rounded-[12px] bg-primary/10 flex items-center justify-center shadow-stripe-ambient">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Settings</h1>
            <p className="text-muted-foreground font-light text-[15px]">
              Manage your preferences
            </p>
          </div>
        </div>

        <Card className="border-border shadow-stripe-ambient rounded-[16px] overflow-hidden bg-card">
          <CardHeader className="bg-secondary/30 border-b border-border pb-6">
            <CardTitle className="text-xl font-light tracking-tight text-foreground">Profile</CardTitle>
            <CardDescription className="text-muted-foreground font-light text-[14px]">
              Your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="space-y-3">
              <Label htmlFor="settings-email" className="text-foreground font-medium">Email</Label>
              <Input
                id="settings-email"
                value={email}
                disabled
                className="bg-secondary/50 border-border text-muted-foreground h-11 px-4 rounded-[8px]"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="settings-display-name" className="text-foreground font-medium">Display Name</Label>
              <Input
                id="settings-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary h-11 px-4 rounded-[8px]"
              />
            </div>

            <Separator className="bg-border" />

            <div className="space-y-3">
              <Label htmlFor="settings-default-model" className="text-foreground font-medium">Default Model</Label>
              <p className="text-[13px] text-muted-foreground font-light">
                This model will be selected by default when creating new chats
              </p>
              <Select
                value={defaultModel}
                onValueChange={(value) => setDefaultModel(value as typeof defaultModel)}
              >
                <SelectTrigger id="settings-default-model" className="w-full bg-background border-border text-foreground focus:ring-primary h-11 px-4 rounded-[8px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border shadow-stripe-elevated rounded-[8px]">
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-foreground hover:bg-primary/5 focus:bg-primary/5 cursor-pointer">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white shadow-stripe-ambient rounded-[8px] h-10 px-6 font-normal"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
