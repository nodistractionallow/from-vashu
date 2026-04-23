import { useEffect, useRef, useState } from 'react';

interface MemePlayerProps {
  src: string;
  maxDuration?: number;
  title?: string;
  titleOwner?: 'vashu' | 'vaisakha';
  onEnded: () => void;
}

export default function MemePlayer({ src, maxDuration, title, titleOwner, onEnded }: MemePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endedRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  // setShowOverlay kept for potential future use
  const [, setShowOverlay] = useState(true);
  const [titleState, setTitleState] = useState<'hidden' | 'visible' | 'out'>('hidden');

  const titleColor = titleOwner === 'vaisakha' ? '#f472b6' : '#ec4899';

  const doEnd = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    const v = videoRef.current;
    if (v) {
      v.pause();
      // Detach src to free memory
      setTimeout(() => { try { v.src = ''; v.load(); } catch (_) {} }, 100);
    }
    setTimeout(onEnded, 280);
  };

  useEffect(() => {
    endedRef.current = false;
    setIsReady(false);
    setShowOverlay(true);
    setTitleState('hidden');

    const video = videoRef.current;
    if (!video) return;

    // Clear previous
    video.pause();
    video.removeAttribute('src');
    video.load();

    const onCanPlay = () => {
      setIsReady(true);
      // Fade in overlay → then fade it to transparent (reveal video)
      setTimeout(() => setShowOverlay(false), 80);

      const tryPlay = video.play();
      if (tryPlay) tryPlay.catch(() => {});

      // Schedule title display in middle of the clip
      if (title) {
        const clipDur = maxDuration ?? (video.duration > 0 && isFinite(video.duration) ? video.duration : 7);
        // Show title at 30–45% into clip
        const showAt = Math.min(clipDur * 0.35, clipDur - 2) * 1000;
        titleTimerRef.current = setTimeout(() => {
          setTitleState('visible');
          setTimeout(() => setTitleState('out'), 1800);
          setTimeout(() => setTitleState('hidden'), 2400);
        }, showAt);
      }

      // Hard stop at maxDuration
      if (maxDuration) {
        maxTimerRef.current = setTimeout(doEnd, maxDuration * 1000 - 200);
      }
    };

    const onEnded = () => doEnd();
    const onError = () => {
      // Still end gracefully after timeout
      setTimeout(doEnd, (maxDuration ?? 8) * 1000);
    };

    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onError, { once: true });

    // Preload + assign
    video.preload = 'auto';
    video.src = src;
    video.load();

    return () => {
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <>
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Meme content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-lg"
          style={{
            borderRadius: '1.25rem',
            overflow: 'hidden',
            boxShadow: '0 0 80px rgba(236,72,153,0.35), 0 25px 60px rgba(0,0,0,0.6)',
            willChange: 'transform',
          }}
        >
          {/* Loading spinner */}
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 rounded-[1.25rem]">
              <div
                className="h-14 w-14 rounded-full border-4 border-pink-900 border-t-pink-400"
                style={{ animation: 'spin 0.7s linear infinite', willChange: 'transform' }}
              />
            </div>
          )}

          {/* Video */}
          <video
            ref={videoRef}
            playsInline
            muted={false}
            disablePictureInPicture
            className="block w-full"
            style={{
              borderRadius: '1.25rem',
              opacity: isReady ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              willChange: 'opacity',
            }}
            onContextMenu={e => e.preventDefault()}
          />

          {/* Title overlay */}
          {title && titleState !== 'hidden' && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                background: 'rgba(0,0,0,0.72)',
                opacity: titleState === 'visible' ? 1 : 0,
                transition: 'opacity 0.45s ease',
                borderRadius: '1.25rem',
              }}
            >
              <p
                style={{
                  color: titleColor,
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textShadow: `0 0 24px ${titleColor}cc, 0 3px 10px rgba(0,0,0,0.9)`,
                  transform: titleState === 'visible' ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
                  transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                  padding: '0.5em 1em',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '0.75rem',
                  display: 'block',
                }}
              >
                {title}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        video::-webkit-media-controls,
        video::-webkit-media-controls-enclosure,
        video::-webkit-media-controls-panel { display: none !important; }
        video { -webkit-appearance: none; }
      `}</style>
    </>
  );
}
