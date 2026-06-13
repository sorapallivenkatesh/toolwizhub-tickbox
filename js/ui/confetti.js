/* ui/confetti.js — dependency-free confetti burst on a full-screen canvas.
   Respects prefers-reduced-motion (caller falls back to a toast). */

import { $ } from "./dom.js";

const COLORS = ["#0ea5a5", "#22d3ee", "#16b981", "#f59e0b", "#38bdf8", "#ff6b6b"];

let canvas, ctx, pieces = [], rafId = null;

function ensureCanvas() {
  if (!canvas) {
    canvas = $("#confetti-canvas");
    ctx = canvas.getContext("2d");
    window.addEventListener("resize", () => { if (rafId) size(); });
  }
}

function size() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function celebrate() {
  ensureCanvas();
  size();
  for (let k = 0; k < 140; k++) {
    pieces.push({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: innerHeight / 3,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -16 - 4,
      g: 0.32 + Math.random() * 0.18,
      size: 6 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: Math.random() < 0.5 ? "rect" : "circ",
      life: 0,
    });
  }
  if (!rafId) tick();
}

function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces.forEach((p) => {
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life++;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, 1 - p.life / 160);
    ctx.fillStyle = p.color;
    if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  });
  pieces = pieces.filter((p) => p.life < 170 && p.y < innerHeight + 40);
  if (pieces.length) rafId = requestAnimationFrame(tick);
  else { ctx.clearRect(0, 0, canvas.width, canvas.height); rafId = null; }
}
