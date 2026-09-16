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
    const particleCount = isMobile ? 55 : 110;
    
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
      twinklePhase: number;
      twinkleSpeed: number;
    }

    const particles: Particle[] = [];

    const createParticle = (): Particle => {
      // 3 depth layers
      const layer = Math.random();
      let size, speedMult, opacityBase;
      
      if (layer < 0.33) {
        // Background, slow, small, dim
        size = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        speedMult = 0.5;
        opacityBase = 0.08;
      } else if (layer < 0.66) {
        // Midground, medium
        size = Math.random() * 0.7 + 1.0; // 1.0 to 1.7
        speedMult = 1.0;
        opacityBase = 0.2;
      } else {
        // Foreground, fast, large, bright
        size = Math.random() * 0.5 + 1.7; // 1.7 to 2.2
        speedMult = 1.5;
        opacityBase = 0.35;
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        baseSpeedX: (Math.random() - 0.5) * 0.2 * speedMult,
        baseSpeedY: (Math.random() - 0.5) * 0.2 * speedMult,
        speedX: 0,
        speedY: 0,
        opacity: Math.random() * 0.1 + opacityBase,
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

      // Draw lines between close particles
      const maxConnectDist = 85;
      const maxConnectDistSq = maxConnectDist * maxConnectDist;
      
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < maxConnectDistSq) {
            const dist = Math.sqrt(distSq);
            // Alpha falls off as distance approaches maxConnectDist
            const lineAlpha = (1 - dist / maxConnectDist) * 0.15;
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(201, 168, 76, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

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
        const clampedOpacity = Math.max(0.08, Math.min(0.45, currentOpacity));

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
