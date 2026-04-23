/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react';
import MemePlayer from './components/MemePlayer';
import LoveAnimation from './components/LoveAnimation';
import LogViewer from './components/LogViewer';
import { logger } from './utils/logger';

// ── Meme Configs ──────────────────────────────────────────────────────────────
interface MemeConfig {
  key: string;
  src: string;
  maxDuration?: number;
  title?: string;
  titleOwner?: 'vashu' | 'vaisakha';
}

const MEME_CHAIN: MemeConfig[] = [
  {
    key: 'yes1',
    src: 'https://indianmemetemplates.com/wp-content/uploads/Kya-Baat-Hai-Sir.mp4',
    title: 'Vashu',
    titleOwner: 'vashu',
  },
  {
    key: 'yes2',
    src: 'https://indianmemetemplates.com/wp-content/uploads/arjun-kapoor-angry-reaction.mp4',
    maxDuration: 9,
    title: 'Vaisakha',
    titleOwner: 'vaisakha',
  },
  {
    key: 'yes3',
    src: 'https://indianmemetemplates.com/wp-content/uploads/Koi-Aapse-Pyaar-Kyu-Karega.mp4',
    title: 'Vaisakha',
    titleOwner: 'vaisakha',
  },
  {
    key: 'yes4',
    src: 'https://indianmemetemplates.com/wp-content/uploads/modi-not-answering-questions.mp4',
    maxDuration: 5,
    title: 'Vashu',
    titleOwner: 'vashu',
  },
];

const NO_MEMES: MemeConfig[] = [
  {
    key: 'no1',
    src: 'https://indianmemetemplates.com/wp-content/uploads/Chi-Chi-Wow-Nice.mp4',
    maxDuration: 6,
  },
  {
    key: 'no2',
    src: 'https://indianmemetemplates.com/wp-content/uploads/ruko-jara-sabar-karo.mp4',
  },
];

const LOVE_IMAGE_SRC = 'https://indianmemetemplates.com/wp-content/uploads/I-love-you-in-every-universe-1024x576.jpg';
const LEKIN_MEME: MemeConfig = {
  key: 'lekin',
  src: 'https://indianmemetemplates.com/wp-content/uploads/Lekin-ek-second-Carryminati.mp4',
};

const SOUND_NO = 'https://us-tuna-sounds-files.voicemod.net/cfdc221d-7710-48b5-86d4-5d6d88474f34.mp3';
const SOUND_YES = 'https://us-tuna-sounds-files.voicemod.net/ef37b241-7efe-4dd1-8a29-08f66bcf1fb6-1666762203366.mp3';

// NO button escape positions (as % of viewport, kept inside bounds)
const NO_POSITIONS = [
  { top: 18, left: 58 },
  { top: 65, left: 15 },
  { top: 38, left: 72 },
  { top: 12, left: 28 },
  { top: 72, left: 60 },
  { top: 82, left: 40 },
  { top: 28, left: 10 },
  { top: 55, left: 75 },
  { top: 45, left: 48 },
  { top: 20, left: 80 },
];

// ── Main App ──────────────────────────────────────────────────────────────────
type AppPhase = 'question' | 'no_meme' | 'yes_memes' | 'love_image' | 'lekin_meme' | 'love_anim';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('question');
  const [noClickCount, setNoClickCount] = useState(0);
  const [noPosIdx, setNoPosIdx] = useState(0);
  const [noVisible, setNoVisible] = useState(true);
  const [showLogViewer, setShowLogViewer] = useState(false);

  // Meme state
  const [activeMeme, setActiveMeme] = useState<MemeConfig | null>(null);
  const [yesMemeIdx, setYesMemeIdx] = useState(0); // which yes meme we're on

  const noSoundRef = useRef<HTMLAudioElement | null>(null);
  const yesSoundRef = useRef<HTMLAudioElement | null>(null);
  const noSoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef(Date.now());
  const vashuBuf = useRef('');

  // Init
  useEffect(() => {
    noSoundRef.current = new Audio(SOUND_NO);
    yesSoundRef.current = new Audio(SOUND_YES);
    logger.sessionStart();
    return () => {
      logger.sessionEnd(Date.now() - sessionStartRef.current);
    };
  }, []);

  // VASHU keyboard secret
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      vashuBuf.current = (vashuBuf.current + k).slice(-5);
      if (vashuBuf.current === 'VASHU') setShowLogViewer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Sound helpers
  const playNoSound = useCallback(() => {
    if (noSoundTimerRef.current) clearTimeout(noSoundTimerRef.current);
    const a = noSoundRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
    noSoundTimerRef.current = setTimeout(() => {
      a.pause();
      a.currentTime = 0;
    }, 3000);
  }, []);

  const playYesSound = useCallback(() => {
    const a = yesSoundRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }, []);

  // ── NO click
  const handleNoClick = useCallback(() => {
    const n = noClickCount + 1;
    setNoClickCount(n);
    logger.log(`NO_CLICK #${n}`);
    playNoSound();

    if (n === 1) {
      setActiveMeme(NO_MEMES[0]);
      setPhase('no_meme');
      logger.log(`MEME_SHOWN: no1`);
    } else if (n === 2) {
      setActiveMeme(NO_MEMES[1]);
      setPhase('no_meme');
      logger.log(`MEME_SHOWN: no2`);
    } else {
      // Button escapes — disappear then reappear elsewhere
      setNoVisible(false);
      setTimeout(() => {
        setNoPosIdx(prev => (prev + 1) % NO_POSITIONS.length);
        setNoVisible(true);
      }, 220);
    }
  }, [noClickCount, playNoSound]);

  // ── YES click
  const handleYesClick = useCallback(() => {
    logger.log(`YES_CLICK (after ${noClickCount} no clicks)`);
    playYesSound();
    setYesMemeIdx(0);
    setActiveMeme(MEME_CHAIN[0]);
    setPhase('yes_memes');
    logger.log(`MEME_SHOWN: yes1`);
  }, [noClickCount, playYesSound]);

  // ── Meme ended
  const handleMemeEnd = useCallback(() => {
    logger.log(`MEME_ENDED: ${activeMeme?.key}`);

    if (phase === 'no_meme') {
      setActiveMeme(null);
      setPhase('question');
      return;
    }

    if (phase === 'yes_memes') {
      const nextIdx = yesMemeIdx + 1;
      if (nextIdx < MEME_CHAIN.length) {
        setYesMemeIdx(nextIdx);
        setActiveMeme(MEME_CHAIN[nextIdx]);
        logger.log(`MEME_SHOWN: yes${nextIdx + 1}`);
      } else {
        // All yes memes done → love image
        setActiveMeme(null);
        setPhase('love_image');
        logger.log('LOVE_IMAGE_SHOWN');
        setTimeout(() => {
          setActiveMeme(LEKIN_MEME);
          setPhase('lekin_meme');
          logger.log('MEME_SHOWN: lekin');
        }, 3000);
      }
      return;
    }

    if (phase === 'lekin_meme') {
      setActiveMeme(null);
      setPhase('love_anim');
      logger.log('LOVE_ANIMATION_SHOWN');
      return;
    }
  }, [phase, activeMeme, yesMemeIdx]);

  const pos = NO_POSITIONS[noPosIdx];
  const isNoFloating = noClickCount >= 2;
  const yesScale = Math.min(1 + noClickCount * 0.2, 2.4);

  const showMeme = phase === 'no_meme' || phase === 'yes_memes' || phase === 'lekin_meme';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-pink-950 via-rose-900 to-pink-900">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-pink-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-rose-500/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-pink-300/8 blur-2xl" />
      </div>

      {/* ── Question ── */}
      {phase === 'question' && (
        <QuestionScreen
          noVisible={noVisible}
          isNoFloating={isNoFloating}
          noPosTop={pos.top}
          noPosLeft={pos.left}
          yesScale={yesScale}
          onYes={handleYesClick}
          onNo={handleNoClick}
        />
      )}

      {/* ── Love Image ── */}
      {phase === 'love_image' && (
        <div className="flex min-h-screen items-center justify-center p-6 animate-fadeIn">
          <img
            src={LOVE_IMAGE_SRC}
            alt="I love you in every universe"
            className="max-h-[80vh] max-w-full rounded-2xl shadow-[0_0_60px_rgba(236,72,153,0.5)] object-contain"
          />
        </div>
      )}

      {/* ── Love Animation ── */}
      {phase === 'love_anim' && <LoveAnimation />}

      {/* ── Meme Overlay ── */}
      {showMeme && activeMeme && (
        <MemePlayer
          key={activeMeme.key}
          src={activeMeme.src}
          maxDuration={activeMeme.maxDuration}
          title={activeMeme.title}
          titleOwner={activeMeme.titleOwner}
          onEnded={handleMemeEnd}
        />
      )}

      {/* ── Log Viewer ── */}
      {showLogViewer && <LogViewer onClose={() => setShowLogViewer(false)} />}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease forwards; }
      `}</style>
    </div>
  );
}

// ── Question Screen ────────────────────────────────────────────────────────────
interface QProps {
  noVisible: boolean;
  isNoFloating: boolean;
  noPosTop: number;
  noPosLeft: number;
  yesScale: number;
  onYes: () => void;
  onNo: () => void;
}

function QuestionScreen({ noVisible, isNoFloating, noPosTop, noPosLeft, yesScale, onYes, onNo }: QProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 text-center select-none overflow-hidden">
      <HeartsRain />

      <div className="relative z-10 mx-auto w-full max-w-sm rounded-3xl border border-pink-400/25 bg-pink-950/55 px-7 py-9 shadow-2xl"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        {/* Avatar */}
        <div className="mb-5 flex justify-center">
          <div className="relative h-28 w-28">
            {[0, 1].map(i => (
              <span
                key={i}
                className="absolute inset-0 rounded-full border-2 border-pink-400"
                style={{
                  animation: `rippleQ 2.5s ease-out ${i * 1.2}s infinite`,
                  opacity: 0,
                }}
              />
            ))}
            <div className="relative h-28 w-28 rounded-full border-[3px] border-pink-400 bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/40 overflow-hidden">
              <span className="text-6xl leading-none">🌸</span>
            </div>
          </div>
        </div>

        <p className="text-xs font-semibold tracking-[0.25em] text-pink-400/70 uppercase mb-2">
          — a message from Vashu —
        </p>
        <h1 className="text-3xl font-black text-white leading-tight mb-1">
          Hey Vaisakha 💕
        </h1>
        <p className="mt-4 mb-7 text-xl font-semibold text-pink-100/90 leading-relaxed">
          Will you be my{' '}
          <span className="text-pink-300 italic">forever Valentine?</span>
          <span className="ml-1">🥺</span>
        </p>

        {/* YES button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onYes}
            style={{
              transform: `scale(${yesScale})`,
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              transformOrigin: 'center',
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-4 text-xl font-black text-white shadow-xl shadow-pink-600/40 active:brightness-90 hover:brightness-110 transition-[filter] duration-200"
          >
            💗 Yes!
          </button>

          {/* Inline NO (first 2 clicks) */}
          {!isNoFloating && (
            <button
              onClick={onNo}
              style={{
                opacity: noVisible ? 1 : 0,
                transition: 'opacity 0.18s ease',
              }}
              className="w-full rounded-2xl border border-white/20 bg-white/8 px-8 py-4 text-xl font-semibold text-pink-200 hover:bg-white/15 active:bg-white/5 transition-colors duration-200"
            >
              No 😅
            </button>
          )}
        </div>
      </div>

      {/* Floating NO (after 2 clicks) */}
      {isNoFloating && (
        <button
          onClick={onNo}
          style={{
            position: 'fixed',
            top: `${noPosTop}%`,
            left: `${noPosLeft}%`,
            opacity: noVisible ? 1 : 0,
            transform: `translate(-50%, -50%)`,
            transition: 'opacity 0.18s ease, top 0.38s cubic-bezier(0.34,1.56,0.64,1), left 0.38s cubic-bezier(0.34,1.56,0.64,1)',
            zIndex: 30,
            pointerEvents: noVisible ? 'auto' : 'none',
          }}
          className="rounded-2xl border border-white/20 bg-black/40 px-6 py-3 text-lg font-semibold text-pink-200 shadow-lg backdrop-blur-sm"
        >
          No 😅
        </button>
      )}

      <style>{`
        @keyframes rippleQ {
          0%   { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Floating hearts ────────────────────────────────────────────────────────────
function HeartsRain() {
  const items = [
    { e: '💕', d: 4.5, delay: 0 },
    { e: '❤️', d: 5.5, delay: 0.8 },
    { e: '🌸', d: 4, delay: 1.6 },
    { e: '💝', d: 6, delay: 0.3 },
    { e: '💖', d: 5, delay: 2.1 },
    { e: '✨', d: 4.8, delay: 1.2 },
    { e: '🌺', d: 5.2, delay: 0.6 },
    { e: '💗', d: 4.3, delay: 1.9 },
    { e: '🦋', d: 6.5, delay: 2.8 },
    { e: '⭐', d: 4.1, delay: 0.4 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((item, i) => (
        <span
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${(i * 10.5) % 95 + 2}%`,
            top: '-2.5rem',
            animation: `fallHeart ${item.d}s linear ${item.delay}s infinite`,
          }}
        >
          {item.e}
        </span>
      ))}
      <style>{`
        @keyframes fallHeart {
          0%   { transform: translateY(0) rotate(0deg) scale(0.8); opacity: 0; }
          8%   { opacity: 0.7; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(105vh) rotate(380deg) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
