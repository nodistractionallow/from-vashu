import { useEffect, useState, useRef } from 'react';

const MESSAGES = [
  { text: 'I Love You', emoji: '💕', color: '#f9a8d4' },
  { text: 'You Mean Everything', emoji: '🌸', color: '#fda4af' },
  { text: 'Always & Forever', emoji: '💝', color: '#f472b6' },
  { text: 'My Vaisakha 💕', emoji: '🌺', color: '#fb7185' },
  { text: 'From Vashu ❤️', emoji: '💗', color: '#f9a8d4' },
];

const EMOJIS = ['💕', '❤️', '🌸', '💝', '💖', '✨', '🌺', '💗', '⭐', '🦋', '🌷', '💓'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  emoji: string;
  opacity: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
}

export default function LoveAnimation() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgVisible, setMsgVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Message cycling — smooth fade in/out
  useEffect(() => {
    const t1 = setTimeout(() => setMsgVisible(true), 100);
    const cycle = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIndex(prev => (prev + 1) % MESSAGES.length);
        setMsgVisible(true);
      }, 600);
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearInterval(cycle);
    };
  }, []);

  // Canvas particle engine — all on GPU compositing path
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const spawnBatch = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push({
          x: Math.random() * W,
          y: H + 30,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(1.2 + Math.random() * 2.2),
          size: 16 + Math.random() * 20,
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          opacity: 0,
          life: 0,
          maxLife: 130 + Math.random() * 90,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.04,
        });
      }
    };

    spawnRef.current = setInterval(spawnBatch, 250);

    const draw = (ts: number) => {
      if (!running) return;
      rafRef.current = requestAnimationFrame(draw);

      // Delta time cap to avoid huge jumps
      const dt = Math.min(ts - lastTimeRef.current, 50);
      lastTimeRef.current = ts;
      const dtFactor = dt / 16.67; // normalise to 60fps

      const W = window.innerWidth;
      const H = window.innerHeight;

      ctx.clearRect(0, 0, W, H);

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life += dtFactor;
        if (p.life >= p.maxLife) continue;
        alive.push(p);

        p.x += p.vx * dtFactor;
        p.y += p.vy * dtFactor;
        p.rotation += p.rotSpeed * dtFactor;
        // gentle drift
        p.vx += (Math.random() - 0.5) * 0.05 * dtFactor;

        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio < 0.12) p.opacity = lifeRatio / 0.12;
        else if (lifeRatio > 0.72) p.opacity = 1 - (lifeRatio - 0.72) / 0.28;
        else p.opacity = 1;

        ctx.save();
        ctx.globalAlpha = p.opacity * 0.82;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      }
      particlesRef.current = alive;
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const msg = MESSAGES[msgIndex];

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ contain: 'layout style paint' }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          willChange: 'transform',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-7 px-6 text-center">
        {/* Heartbeat */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {/* Ripple rings */}
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="absolute rounded-full border-2 border-pink-400"
              style={{
                width: 150,
                height: 150,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: `loveRipple 2.6s ease-out ${i * 0.85}s infinite`,
                pointerEvents: 'none',
              }}
            />
          ))}
          <span
            style={{
              fontSize: 96,
              lineHeight: 1,
              display: 'block',
              filter: 'drop-shadow(0 0 28px #ec489999)',
              animation: 'loveHeart 1.3s ease-in-out infinite',
              willChange: 'transform',
            }}
          >
            ❤️
          </span>
        </div>

        {/* Message */}
        <div
          style={{
            opacity: msgVisible ? 1 : 0,
            transform: msgVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.9)',
            transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            willChange: 'opacity, transform',
          }}
        >
          <p
            className="font-black leading-tight"
            style={{
              fontFamily: "'Georgia', serif",
              color: msg.color,
              textShadow: `0 0 32px ${msg.color}99`,
              fontSize: 'clamp(2rem, 9vw, 3.5rem)',
            }}
          >
            {msg.text}
          </p>
          <p style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', lineHeight: 1.3, marginTop: 8 }}>{msg.emoji}</p>
        </div>

        {/* Subtitle */}
        <p
          className="text-pink-300/60 font-semibold tracking-[0.22em] uppercase"
          style={{ fontSize: 'clamp(0.65rem, 2.5vw, 0.85rem)' }}
        >
          — With all my heart —
        </p>

        {/* Name tags */}
        <div className="flex flex-wrap justify-center gap-3 mt-1">
          {['Vashu', '&', 'Vaisakha'].map((w, i) => (
            <span
              key={i}
              className="font-bold"
              style={{
                fontSize: 'clamp(0.95rem, 4vw, 1.15rem)',
                padding: i === 1 ? '0' : '0.4em 1.1em',
                borderRadius: '9999px',
                background: i === 1 ? 'transparent' : 'rgba(236,72,153,0.18)',
                border: i === 1 ? 'none' : '1px solid rgba(236,72,153,0.35)',
                color: i === 1 ? '#f9a8d4' : '#fce7f3',
                animation: i !== 1 ? `nameFloat ${2.4 + i * 0.4}s ease-in-out infinite alternate` : 'none',
                willChange: 'transform',
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes loveHeart {
          0%, 100% { transform: scale(1); }
          14%       { transform: scale(1.18); }
          28%       { transform: scale(1); }
          42%       { transform: scale(1.12); }
          56%       { transform: scale(1); }
        }
        @keyframes loveRipple {
          0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.65; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes nameFloat {
          from { transform: translateY(0); }
          to   { transform: translateY(-9px); }
        }
      `}</style>
    </div>
  );
}
