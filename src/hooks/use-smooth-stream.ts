import { useState, useEffect } from "react";

/**
 * Smoothes out text generation by gradually revealing characters
 * instead of jumping in large blocky chunks.
 */
export function useSmoothStream(rawContent: string, isStreaming: boolean, speed = 20) {
  const [smoothContent, setSmoothContent] = useState("");
  const [prevRawContent, setPrevRawContent] = useState(rawContent);
  const [prevIsStreaming, setPrevIsStreaming] = useState(isStreaming);

  // Adjust state during render when props change
  if (rawContent !== prevRawContent || isStreaming !== prevIsStreaming) {
    setPrevRawContent(rawContent);
    setPrevIsStreaming(isStreaming);

    if (rawContent.length === 0) {
      setSmoothContent("");
    } else if (!isStreaming && rawContent) {
      setSmoothContent(rawContent);
    }
  }

  useEffect(() => {
    // If we've already snapped or reset during render, or there's no work to do, just return
    if ((!isStreaming && rawContent) || rawContent.length === 0) {
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
