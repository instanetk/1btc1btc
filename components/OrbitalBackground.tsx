"use client";
import { useRef, useEffect } from "react";
import styles from "./OrbitalBackground.module.css";

interface Orbit {
  rx: number;
  ry: number;
  tilt: number;
  particles: { angle: number; speed: number; size: number }[];
}

interface Star {
  x: number;
  y: number;
  opacity: number;
}

function createOrbits(): Orbit[] {
  const orbits: Orbit[] = [];
  for (let i = 0; i < 7; i++) {
    const base = 0.12 + i * 0.11;
    const particles = [];
    const count = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < count; j++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.0003 + Math.random() * 0.0004,
        size: 2 + Math.random() * 2,
      });
    }
    orbits.push({
      rx: base + Math.random() * 0.04,
      ry: base * (0.5 + Math.random() * 0.3),
      tilt: ((i * 15 + Math.random() * 20 - 10) * Math.PI) / 180,
      particles,
    });
  }
  return orbits;
}

function createStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    opacity: 0.05 + Math.random() * 0.12,
  }));
}

export function OrbitalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const orbits = createOrbits();
    const stars = createStars(40);
    let rotation = 0;
    let animId: number;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx!.clearRect(0, 0, w, h);

      // Radial center glow
      const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
      glow.addColorStop(0, "rgba(247, 147, 26, 0.05)");
      glow.addColorStop(1, "transparent");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, w, h);

      // Static stars
      for (const star of stars) {
        ctx!.beginPath();
        ctx!.arc(star.x * w, star.y * h, 1, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(245, 240, 232, ${star.opacity})`;
        ctx!.fill();
      }

      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(rotation);

      for (const orbit of orbits) {
        const rx = orbit.rx * Math.max(w, h);
        const ry = orbit.ry * Math.max(w, h);

        ctx!.save();
        ctx!.rotate(orbit.tilt);

        // Draw orbit path
        ctx!.beginPath();
        ctx!.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx!.strokeStyle = "rgba(247, 147, 26, 0.15)";
        ctx!.lineWidth = 1.5;
        ctx!.stroke();

        // Draw particles along orbit
        for (const p of orbit.particles) {
          if (!prefersReducedMotion) {
            p.angle += p.speed;
          }
          const px = Math.cos(p.angle) * rx;
          const py = Math.sin(p.angle) * ry;

          ctx!.beginPath();
          ctx!.arc(px, py, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = "rgba(247, 147, 26, 0.5)";
          ctx!.fill();
        }

        ctx!.restore();
      }

      ctx!.restore();

      if (!prefersReducedMotion) {
        rotation += 0.00017; // ~0.01 deg/frame ≈ 0.6 deg/s
        animId = requestAnimationFrame(draw);
      }
    }

    draw();

    // For reduced motion, draw once statically
    if (prefersReducedMotion) {
      return () => window.removeEventListener("resize", resize);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
