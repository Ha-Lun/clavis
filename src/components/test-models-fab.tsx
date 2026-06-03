"use client";

import { useState } from "react";
import { FlaskConical, CheckCircle2, XCircle, Loader2, Play } from "lucide-react";
import { MODELS, ModelInfo } from "@/lib/models";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TestStatus = "idle" | "testing" | "success" | "error";

interface ModelState {
  id: string;
  name: string;
  status: TestStatus;
  error?: string;
}

export function TestModelsFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [modelStates, setModelStates] = useState<ModelState[]>(
    MODELS.filter((m) => m.id !== "auto").map((m) => ({
      id: m.id,
      name: m.name,
      status: "idle",
    }))
  );

  const testModel = async (modelId: string) => {
    setModelStates((prev) =>
      prev.map((s) => (s.id === modelId ? { ...s, status: "testing", error: undefined } : s))
    );

    try {
      const res = await fetch("/api/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });

      const data = await res.json();

      if (data.success) {
        setModelStates((prev) =>
          prev.map((s) => (s.id === modelId ? { ...s, status: "success" } : s))
        );
      } else {
        setModelStates((prev) =>
          prev.map((s) => (s.id === modelId ? { ...s, status: "error", error: data.error } : s))
        );
      }
    } catch (err: any) {
      setModelStates((prev) =>
        prev.map((s) => (s.id === modelId ? { ...s, status: "error", error: "Failed to fetch" } : s))
      );
    }
  };

  const runAllTests = async () => {
    setIsTestingAll(true);
    // Reset all states first
    setModelStates((prev) => prev.map((s) => ({ ...s, status: "idle", error: undefined })));
    
    // Run tests sequentially to avoid overwhelming the API
    for (const model of modelStates) {
      await testModel(model.id);
    }
    setIsTestingAll(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 size-12 rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 text-primary transition-all duration-300 z-50 group"
        >
          <FlaskConical className="size-6 group-hover:scale-110 transition-transform" />
          <span className="sr-only">Test Models</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-md border-primary/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary flex items-center gap-2">
            <FlaskConical className="size-5" />
            Model Availability Test
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ping each model to check if they are currently responding within 15 seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {modelStates.map((model) => (
            <div
              key={model.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{model.name}</span>
                {model.error && (
                  <span className="text-[10px] text-red-400 truncate max-w-[200px]">
                    {model.error}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {model.status === "testing" && (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                {model.status === "success" && (
                  <CheckCircle2 className="size-4 text-green-500" />
                )}
                {model.status === "error" && (
                  <XCircle className="size-4 text-red-500" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-primary/10 hover:text-primary"
                  onClick={() => testModel(model.id)}
                  disabled={model.status === "testing" || isTestingAll}
                >
                  <Play className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={runAllTests}
            disabled={isTestingAll}
            className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
          >
            {isTestingAll ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Testing&hellip;
              </>
            ) : (
              "Test All Models"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
