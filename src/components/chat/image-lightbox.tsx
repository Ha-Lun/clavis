"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  // Lock body scroll while open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    const filename = `clavis-generated-${Date.now()}.png`;

    try {
      // For Appwrite URLs (or any cross-origin), fetch the blob first
      const response = await fetch(src);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: direct anchor download (works for same-origin / data URIs)
      const anchor = document.createElement("a");
      anchor.href = src;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  }, [src]);

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-overlay"
        className={cn(
          "fixed inset-0 z-[100] flex items-center justify-center",
          "bg-black/80 backdrop-blur-xl"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onClose}
      >
        {/* Top-right button bar */}
        <motion.div
          className={cn(
            "absolute top-4 right-4 z-[110] flex items-center gap-2",
            "rounded-full border border-white/10 bg-white/5 px-2 py-1.5",
            "backdrop-blur-md shadow-lg"
          )}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDownload}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "text-[#c9a84c]/80 transition-colors duration-200",
              "hover:bg-[#c9a84c]/10 hover:text-[#c9a84c]"
            )}
            aria-label="Download image"
          >
            <Download className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              "text-[#c9a84c]/80 transition-colors duration-200",
              "hover:bg-[#c9a84c]/10 hover:text-[#c9a84c]"
            )}
            aria-label="Close lightbox"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Image */}
        <motion.img
          key="lightbox-image"
          src={src}
          alt={alt || "Generated image"}
          className={cn(
            "max-h-[85vh] max-w-[90vw] rounded-lg object-contain",
            "border border-[#c9a84c]/20 shadow-2xl shadow-black/50"
          )}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </motion.div>
    </AnimatePresence>
  );
}
