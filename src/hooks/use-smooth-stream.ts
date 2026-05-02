import { useState, useEffect } from "react";

/**
 * Smoothes out text generation by gradually revealing characters
 * instead of jumping in large blocky chunks.
 */
export function useSmoothStream(rawContent: string, isStreaming: boolean, speed = 20) {
  const [smoothContent, setSmoothContent] = useState("");

  useEffect(() => {
    if (!isStreaming && rawContent) {
      // If stream finished, snap to full content immediately to avoid hanging
      setSmoothContent(rawContent);
      return;
    }

    if (rawContent.length === 0) {
      setSmoothContent("");
      return;
    }

    let intervalId: NodeJS.Timeout;

    if (smoothContent.length < rawContent.length) {
      // We are behind, catch up
      intervalId = setInterval(() => {
        setSmoothContent((prev) => {
          if (prev.length >= rawContent.length) {
            clearInterval(intervalId);
            return prev;
          }
          
          // Calculate how far behind we are to dynamically adjust chunk size
          const diff = rawContent.length - prev.length;
          const chunkSize = Math.max(1, Math.floor(diff / 5)); // Catch up faster if lagging
          
          return rawContent.slice(0, prev.length + chunkSize);
        });
      }, speed);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [rawContent, smoothContent.length, isStreaming, speed]);

  return smoothContent;
}
