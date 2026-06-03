"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, AlertTriangle, ArrowLeft, Loader2, Sparkles, Zap, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DowngradeModal({ isOpen, onClose, onConfirm }: DowngradeModalProps) {
  const [loading, setLoading] = useState(false);

  const benefits = [
    {
      icon: Crown,
      title: "Premium AI Access",
      desc: "Unlock premium models (GPT 5.5, Gemini 3.1 Pro, and Opus 4.7).",
    },
    {
      icon: Zap,
      title: "Unlimited Uploads",
      desc: "Upload unlimited project files and context documents.",
    },
    {
      icon: Globe,
      title: "Parallel Council Consults",
      desc: "Run 3 premium models in parallel inside the Model Council.",
    },
    {
      icon: Shield,
      title: "Priority Execution",
      desc: "Experience zero latency with high-priority GPU execution speeds.",
    },
  ];

  const handleDowngrade = async () => {
    setLoading(true);
    // Simulate a brief secure connection / processing state
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className={cn(
        "bg-[#0a0a0f]/95 border border-[#c9a84c]/20 text-foreground",
        "max-w-md rounded-2xl shadow-2xl shadow-black/90 p-0 overflow-hidden",
        "backdrop-blur-xl"
      )}>
        <DialogTitle className="sr-only">Downgrade subscription</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2 pt-4 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 size-48 bg-destructive/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/30 text-destructive mb-2">
              <AlertTriangle className="size-6" />
            </div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white font-cinzel">
              ARE YOU SURE?
            </h2>
            <p className="text-[12px] text-muted-foreground font-light max-w-xs mx-auto">
              Downgrading to the Free Tier means you will immediately lose your premium privileges:
            </p>
          </div>

          {/* Benefits list (that will be lost) */}
          <div className="space-y-3 py-1">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-red-500/[0.03] bg-red-500/[0.01] hover:bg-white/[0.01] transition-colors">
                  <div className="size-7 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                    <Icon className="size-3.5 text-destructive/70" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[12px] font-semibold text-white/90">{b.title}</h4>
                    <p className="text-[11px] text-muted-foreground/80 font-light leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <Button
              onClick={onClose}
              disabled={loading}
              className={cn(
                "w-full h-10 text-[13px] font-semibold rounded-xl transition-all duration-300",
                "bg-gradient-to-r from-[#c9a84c] to-[#a88636] hover:from-[#d9b85c] hover:to-[#b89646]",
                "text-black hover:shadow-glow cursor-pointer"
              )}
            >
              <ArrowLeft className="mr-2 size-4" />
              Keep My Pro Privileges
            </Button>

            <Button
              variant="ghost"
              onClick={handleDowngrade}
              disabled={loading}
              className={cn(
                "w-full h-10 text-[12px] font-medium rounded-xl transition-all duration-200 cursor-pointer",
                "text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Downgrading&hellip;
                </>
              ) : (
                "Yes, downgrade to Free"
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
