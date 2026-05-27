"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, Sparkles, Zap, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SubscriptionModal({ isOpen, onClose, onSuccess }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentSetupPending, setPaymentSetupPending] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Simulate securing connection/validating checkout
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setPaymentSetupPending(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: Crown,
      title: "Premium AI Access",
      desc: "Unlock GPT 5.5, Gemini 3.1 Pro, and Opus 4.7 models.",
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className={cn(
        "bg-[#0a0a0f]/95 border border-[#c9a84c]/20 text-foreground",
        "max-w-md rounded-2xl shadow-2xl shadow-black/90 p-0 overflow-hidden",
        "backdrop-blur-xl"
      )}>
        <DialogTitle className="sr-only">Upgrade to Pro</DialogTitle>
        <AnimatePresence mode="wait">
          {!paymentSetupPending ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-2 pt-4 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#a88636] text-black shadow-glow mb-2 animate-bounce duration-[3000ms]">
                  <Crown className="h-6 w-6 fill-current" />
                </div>
                <h2 className="text-[22px] font-semibold tracking-tight text-white font-cinzel">
                  CLAVIS <span className="text-[#c9a84c] font-normal">PRO</span>
                </h2>
                <p className="text-[12px] text-muted-foreground font-light max-w-xs mx-auto">
                  Upgrade your intelligence workspace to high-performance dark luxury computing.
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-4 py-2">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className="flex items-start gap-3.5 p-3 rounded-lg border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                      <div className="h-8 w-8 rounded-md bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
                        <Icon className="h-4.5 w-4.5 text-[#c9a84c]" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[13px] font-semibold text-white">{b.title}</h4>
                        <p className="text-[11.5px] text-muted-foreground font-light leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pricing & Button */}
              <div className="space-y-4 pt-2">
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-3xl font-bold text-white">$20</span>
                  <span className="text-muted-foreground text-[13px] font-light">/ month</span>
                </div>

                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className={cn(
                    "w-full h-11 text-[13px] font-semibold rounded-xl transition-all duration-300",
                    "bg-gradient-to-r from-[#c9a84c] to-[#a88636] hover:from-[#d9b85c] hover:to-[#b89646]",
                    "text-black hover:shadow-glow cursor-pointer"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                      Securing connection...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 fill-current" />
                      Pay
                    </>
                  )}
                </Button>
                
                <p className="text-center text-[10px] text-muted-foreground/40 font-light">
                  Secured by Clavis Luxe Pay. Cancel anytime in your dashboard settings.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 text-center space-y-6 flex flex-col items-center justify-center"
            >
              <div className="h-16 w-16 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c] shadow-glow animate-pulse">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[20px] font-semibold text-white font-cinzel tracking-widest">COMING SOON</h3>
                <p className="text-[12.5px] text-muted-foreground font-light max-w-xs mx-auto leading-relaxed">
                  Live payment integration and Pro tier subscriptions are currently under active development. Set up checkout gateways or check back soon to upgrade your account!
                </p>
              </div>
              <Button
                onClick={() => {
                  setPaymentSetupPending(false);
                  onClose();
                }}
                className={cn(
                  "h-9.5 px-6 text-[12px] font-medium rounded-xl transition-all duration-200 cursor-pointer",
                  "border border-[#c9a84c]/20 bg-[#c9a84c]/5 text-[#c9a84c] hover:bg-[#c9a84c]/10 hover:text-[#d9b85c]"
                )}
              >
                Return to Workspace
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
