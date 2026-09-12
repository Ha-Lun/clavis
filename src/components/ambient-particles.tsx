"use client";

import { useEffect, useRef } from "react";

export function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const isMobile = width < 768;
    const particleCount = isMobile ? 20 : 40;
    
    // Store mouse pos for avoidance
    let mouseX = -1000;
    let mouseY = -1000;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    interface Particle {
      x: number;
      y: number;
      size: number;
      baseSpeedX: number;
      baseSpeedY: number;
      speedX: number;
      speedY: number;
      opacity: number;
      targetOpacity: number;
      twinklePhase: number;
      twinkleSpeed: number;
    }

    const particles: Particle[] = [];

    const createParticle = (): Particle => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        baseSpeedX: (Math.random() - 0.5) * 0.2,
        baseSpeedY: (Math.random() - 0.5) * 0.2,
        speedX: 0,
        speedY: 0,
        opacity: Math.random() * 0.35 + 0.1,
        targetOpacity: Math.random() * 0.35 + 0.1,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Drift and mouse avoidance
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distSq = dx * dx + dy * dy;
        const maxDist = 150;
        const maxDistSq = maxDist * maxDist;

        let forceX = 0;
        let forceY = 0;
        if (distSq < maxDistSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (maxDist - dist) / maxDist; // 0 to 1
          forceX = -(dx / dist) * force * 0.5;
          forceY = -(dy / dist) * force * 0.5;
        }

        // Smoothly apply force
        p.speedX += (p.baseSpeedX + forceX - p.speedX) * 0.05;
        p.speedY += (p.baseSpeedY + forceY - p.speedY) * 0.05;

        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Twinkle
        p.twinklePhase += p.twinkleSpeed;
        const currentOpacity = p.opacity + Math.sin(p.twinklePhase) * 0.15;
        const clampedOpacity = Math.max(0.1, Math.min(0.45, currentOpacity));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // #c9a84c is the gold color
        ctx.fillStyle = `rgba(201, 168, 76, ${clampedOpacity})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-80"
      aria-hidden="true"
    />
  );
}
