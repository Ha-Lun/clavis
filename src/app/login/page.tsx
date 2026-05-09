"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { login } from "@/lib/appwrite/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (formData: FormData) => {
    setError("");
    setLoading(true);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.06),transparent)]" />

      <motion.div
        className="w-full max-w-sm relative"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-light tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1 text-[13px] text-muted-foreground font-light">Sign in to your Flux account</p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-6">
          <form action={handleLogin} className="space-y-4">
            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-light"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-medium text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={cn(
                  "h-10 bg-background border-border text-foreground text-[14px] font-light rounded-md",
                  "focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40",
                  "placeholder:text-muted-foreground/35"
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px] font-medium text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={cn(
                  "h-10 bg-background border-border text-foreground text-[14px] font-light rounded-md",
                  "focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40",
                  "placeholder:text-muted-foreground/35"
                )}
              />
            </div>

            <motion.div whileTap={{ scale: 0.98 }} className="pt-1">
              <Button
                type="submit"
                className="w-full h-10 text-[14px] font-medium bg-primary text-white hover:bg-primary/90 rounded-md cursor-pointer transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </motion.div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[13px] text-muted-foreground mt-5 font-light">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground hover:text-primary transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
