"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, Clock, Users, AlertTriangle, CheckCircle2, HelpCircle, Check, X as XIcon } from "lucide-react";
import { COUNCIL_MODELS, DEFAULT_COUNCIL_MODELS } from "@/lib/council";
import type { CouncilResult, CouncilProgressEvent } from "@/lib/council";

const MAX_SELECTED = 3;

type ModelStatus = "idle" | "querying" | "complete" | "error";

interface ModelProgress {
  model: string;
  modelName: string;
  status: ModelStatus;
  latencyMs?: number;
  error?: string;
}

export default function CouncilPage() {
  const [query, setQuery] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([...DEFAULT_COUNCIL_MODELS]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CouncilResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [modelProgress, setModelProgress] = useState<ModelProgress[]>([]);
  const [phase, setPhase] = useState<"idle" | "querying" | "synthesizing" | "done">("idle");
  const abortRef = useRef<AbortController | null>(null);

  const hasQuery = query.trim().length > 0;
  const hasEnoughModels = selectedModels.length === MAX_SELECTED;
  const canRun = hasQuery && hasEnoughModels && !isRunning;

  const toggleModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, modelId];
    });
  }, []);

  const handleRun = useCallback(async () => {
    if (!canRun) return;
    setIsRunning(true);
    setError(null);
    setResult(null);
    setPhase("querying");

    // Initialize progress for selected models
    const initialProgress: ModelProgress[] = selectedModels.map((id) => {
      const info = COUNCIL_MODELS.find((m) => m.id === id);
      return { model: id, modelName: info?.name || id, status: "idle" };
    });
    setModelProgress(initialProgress);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), models: selectedModels }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          try {
            const event: CouncilProgressEvent = JSON.parse(json);
            handleProgressEvent(event);
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Council failed");
        setPhase("idle");
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [canRun, query, selectedModels]);

  const handleProgressEvent = useCallback((event: CouncilProgressEvent) => {
    switch (event.type) {
      case "model_querying":
        setModelProgress((prev) =>
          prev.map((m) =>
            m.model === event.model ? { ...m, status: "querying" as ModelStatus } : m
          )
        );
        break;

      case "model_complete":
        setModelProgress((prev) =>
          prev.map((m) =>
            m.model === event.model
              ? { ...m, status: "complete" as ModelStatus, latencyMs: event.latencyMs }
              : m
          )
        );
        break;

      case "model_error":
        setModelProgress((prev) =>
          prev.map((m) =>
            m.model === event.model
              ? { ...m, status: "error" as ModelStatus, error: event.error, latencyMs: event.latencyMs }
              : m
          )
        );
        break;

      case "synthesizing":
        setPhase("synthesizing");
        break;

      case "result":
        setResult(event.data);
        setPhase("done");
        break;

      case "error":
        setError(event.error);
        setPhase("idle");
        break;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRun();
    }
  };

  const confidenceConfig = {
    high: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2, label: "High Confidence" },
    medium: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: HelpCircle, label: "Medium Confidence" },
    low: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: AlertTriangle, label: "Low Confidence" },
  };

  const completedCount = modelProgress.filter((m) => m.status === "complete" || m.status === "error").length;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
              Model Council
            </h1>
          </div>
          <p className="text-[14px] text-muted-foreground font-normal ml-11">
            Query multiple models in parallel and get a synthesized consensus
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Model Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                Select 3 Models
              </h2>
              <span className="text-[11px] text-muted-foreground/40">
                {selectedModels.length}/{MAX_SELECTED} selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COUNCIL_MODELS.map((model) => {
                const isSelected = selectedModels.includes(model.id);
                const isDisabled = !isSelected && selectedModels.length >= MAX_SELECTED;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => toggleModel(model.id)}
                    disabled={isDisabled || isRunning}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "border-primary/40 bg-primary/[0.08] text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-border hover:bg-white/[0.02]",
                      (isDisabled || isRunning) && "opacity-35 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30 bg-transparent"
                      )}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] font-normal truncate">{model.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Query Input */}
          <div className="space-y-3">
            <h2 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              Query
            </h2>
            <motion.div
              animate={{
                boxShadow: isFocused
                  ? "0 0 0 1px rgba(106,13,173,0.35), 0 0 24px rgba(106,13,173,0.08)"
                  : "0 0 0 1px rgba(0,0,0,0)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "relative flex flex-col rounded-xl bg-card transition-colors duration-100 border",
                isFocused ? "border-primary/40" : "border-border"
              )}
            >
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Ask the council anything…"
                rows={3}
                className={cn(
                  "w-full resize-none bg-transparent",
                  "text-[15px] font-normal leading-relaxed text-foreground",
                  "outline-none placeholder:text-muted-foreground/35",
                  "pt-4 px-5 pb-2 scrollbar-thin"
                )}
                disabled={isRunning}
              />
              <div className="flex items-center justify-end px-4 pb-3">
                <motion.button
                  whileHover={canRun ? { scale: 1.03 } : {}}
                  whileTap={canRun ? { scale: 0.95 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className={cn(
                    "flex items-center gap-2 h-8 px-4 rounded-md text-[13px] font-semibold transition-all duration-150",
                    canRun
                      ? "bg-primary text-white shadow-glow cursor-pointer"
                      : "bg-secondary text-muted-foreground/30 cursor-default"
                  )}
                  onClick={handleRun}
                  disabled={!canRun}
                  id="run-council-button"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Consulting…</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-3.5 w-3.5" />
                      <span>Run Council</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* ─── Live Progress ─── */}
          <AnimatePresence>
            {isRunning && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="space-y-2"
              >
                {/* Phase indicator */}
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-[13px] text-muted-foreground font-medium">
                    {phase === "querying" && `Querying models (${completedCount}/${modelProgress.length})…`}
                    {phase === "synthesizing" && "Synthesizing responses…"}
                  </span>
                </div>

                {/* Per-model status */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-2.5">
                  {modelProgress.map((mp, i) => (
                    <motion.div
                      key={mp.model}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Status icon */}
                        {mp.status === "querying" && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                        )}
                        {mp.status === "complete" && (
                          <div className="h-3.5 w-3.5 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          </div>
                        )}
                        {mp.status === "error" && (
                          <div className="h-3.5 w-3.5 rounded-full bg-red-400/20 flex items-center justify-center shrink-0">
                            <XIcon className="h-2.5 w-2.5 text-red-400" />
                          </div>
                        )}
                        {mp.status === "idle" && (
                          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/20 shrink-0" />
                        )}

                        <span className={cn(
                          "text-[13px] font-normal truncate",
                          mp.status === "complete" ? "text-foreground" :
                          mp.status === "error" ? "text-red-400" :
                          mp.status === "querying" ? "text-foreground" :
                          "text-muted-foreground/50"
                        )}>
                          {mp.modelName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {mp.status === "querying" && (
                          <span className="text-[11px] text-primary font-medium">Generating…</span>
                        )}
                        {mp.status === "complete" && mp.latencyMs && (
                          <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                            {(mp.latencyMs / 1000).toFixed(1)}s
                          </span>
                        )}
                        {mp.status === "error" && (
                          <span className="text-[11px] text-red-400/70 truncate max-w-[120px]">Failed</span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Synthesizer status */}
                  {phase === "synthesizing" && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2.5 pt-2 mt-2 border-t border-border"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0" />
                      <span className="text-[13px] text-amber-400 font-medium">
                        Kimi K2.6 is synthesizing…
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-4 rounded-lg border border-red-400/20 bg-red-400/[0.05]"
              >
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span className="text-[13px] text-red-400 font-normal">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Results ─── */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-5"
              >
                {/* Confidence Badge + Total Latency */}
                <div className="flex items-center gap-3 flex-wrap">
                  {(() => {
                    const conf = confidenceConfig[result.synthesis.confidence] || confidenceConfig.medium;
                    const Icon = conf.icon;
                    return (
                      <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold", conf.bg, conf.color)}>
                        <Icon className="h-3.5 w-3.5" />
                        {conf.label}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-[12px] text-muted-foreground font-normal">
                    <Clock className="h-3 w-3" />
                    {(result.totalLatencyMs / 1000).toFixed(1)}s total
                  </div>
                </div>

                {/* Summary */}
                <div className="p-5 rounded-lg border border-border bg-card space-y-2">
                  <h3 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                    Summary
                  </h3>
                  <p className="text-[14px] text-foreground font-normal leading-relaxed">
                    {result.synthesis.summary}
                  </p>
                </div>

                {/* Consensus */}
                <div className="p-5 rounded-lg border border-primary/15 bg-primary/[0.03] space-y-2">
                  <h3 className="text-[12px] font-semibold text-primary/60 uppercase tracking-widest">
                    Consensus
                  </h3>
                  <p className="text-[14px] text-foreground font-normal leading-relaxed">
                    {result.synthesis.consensus}
                  </p>
                </div>

                {/* Disagreements */}
                {result.synthesis.disagreements.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                      Disagreements
                    </h3>
                    {result.synthesis.disagreements.map((d, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="p-4 rounded-lg border border-border bg-card space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span className="text-[13px] font-semibold text-foreground">
                            {d.topic}
                          </span>
                        </div>
                        <div className="space-y-2 ml-3.5">
                          {d.positions.map((p, j) => {
                            const info = COUNCIL_MODELS.find((m) => m.id === p.model);
                            return (
                              <div key={j} className="flex gap-2">
                                <span className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider shrink-0 mt-0.5 w-20 truncate">
                                  {info?.name || p.model.split("/").pop()}
                                </span>
                                <span className="text-[13px] text-muted-foreground font-normal leading-relaxed">
                                  {p.view}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Per-Model Latency */}
                <div className="p-5 rounded-lg border border-border bg-card space-y-3">
                  <h3 className="text-[12px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                    Model Latency
                  </h3>
                  <div className="space-y-2">
                    {result.modelResponses.map((mr) => (
                      <div key={mr.model} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            mr.error ? "bg-red-400" : "bg-emerald-400"
                          )} />
                          <span className="text-[13px] text-foreground font-normal truncate">
                            {mr.modelName}
                          </span>
                          {mr.error && (
                            <span className="text-[11px] text-red-400 font-normal truncate">
                              (failed)
                            </span>
                          )}
                        </div>
                        <span className="text-[12px] text-muted-foreground font-normal tabular-nums shrink-0 ml-3">
                          {(mr.latencyMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Responses (collapsible) */}
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-widest hover:text-muted-foreground/70 transition-colors py-2">
                    <svg className="h-3 w-3 transition-transform duration-200 group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Individual Responses
                  </summary>
                  <div className="space-y-3 mt-2">
                    {result.modelResponses.map((mr) => (
                      <div key={mr.model} className="p-4 rounded-lg border border-border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-primary/70 uppercase tracking-wider">
                            {mr.modelName}
                          </span>
                          <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                            {(mr.latencyMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                        {mr.error ? (
                          <p className="text-[13px] text-red-400 font-normal italic">{mr.error}</p>
                        ) : (
                          <p className="text-[13px] text-muted-foreground font-normal leading-relaxed whitespace-pre-wrap">
                            {mr.response}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
