'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CareBridgeLoaderProps {
  onComplete?: () => void;
  className?: string;
  dark?: boolean;
}

// Same geometry as /brand/carebridge-mark-*.svg, inlined so it can draw itself.
const MARK_PATH =
  'M94 64 C94 18 162 18 162 64 C162 96 178 100 196 100 C242 100 242 160 196 160 C170 160 162 174 162 196 C162 242 94 242 94 196 C94 164 78 156 60 156 C14 156 14 96 60 96 C84 96 94 90 94 64 Z M162 64 C176 160 105 157 94 196 C80 100 151 103 162 64 Z';

const MIN_VISIBLE_MS = 1400;
const EXIT_MS = 450;

export function CareBridgeLoader({ onComplete, className, dark = false }: CareBridgeLoaderProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const exit = setTimeout(() => setLeaving(true), MIN_VISIBLE_MS);
    const done = setTimeout(() => onComplete?.(), MIN_VISIBLE_MS + EXIT_MS);
    return () => {
      clearTimeout(exit);
      clearTimeout(done);
    };
  }, [onComplete]);

  return (
    <div
      role='status'
      aria-live='polite'
      aria-busy={!leaving}
      className={cn(
        'cb-loader fixed inset-0 z-[9999] flex flex-col items-center justify-center',
        dark ? 'cb-loader--dark' : 'cb-loader--light',
        leaving && 'cb-loader--leaving',
        className
      )}
    >
      <svg viewBox='0 0 256 256' width='72' height='72' aria-hidden='true' className='cb-mark'>
        <path d={MARK_PATH} pathLength={1} fillRule='evenodd' className='cb-mark-path' />
      </svg>

      <p className='cb-wordmark font-heading mt-7 text-[1.375rem] font-semibold tracking-[-0.01em]'>
        CareBridge
      </p>

      <div className='cb-track mt-6 h-[2px] w-28 overflow-hidden rounded-full' aria-hidden='true'>
        <div className='cb-sweep h-full w-1/3 rounded-full' />
      </div>

      <p className='cb-caption mt-4 text-[0.8125rem] tracking-[0.01em]'>Preparing your workspace</p>

      <style jsx>{`
        .cb-loader {
          --cb-ink: #1f3d2b;
          --cb-accent: #2f6b4a;
          --cb-muted: #5b6b60;
          --cb-track: rgba(31, 61, 43, 0.1);
          background:
            radial-gradient(120% 80% at 50% 38%, #fbfaf6 0%, #f3f0e7 70%, #ece8dc 100%);
          color: var(--cb-ink);
          transition: opacity ${EXIT_MS}ms cubic-bezier(0.16, 1, 0.3, 1),
            filter ${EXIT_MS}ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cb-loader--dark {
          --cb-ink: #efe9da;
          --cb-accent: #9cc7a8;
          --cb-muted: #a9b8ac;
          --cb-track: rgba(239, 233, 218, 0.12);
          background:
            radial-gradient(120% 80% at 50% 38%, #1a3627 0%, #12271c 65%, #0c1b13 100%);
        }
        .cb-loader--leaving {
          opacity: 0;
          filter: blur(6px);
          pointer-events: none;
        }

        .cb-mark {
          animation: cb-breathe 3.2s ease-in-out 1.3s infinite;
        }
        .cb-mark-path {
          fill: var(--cb-ink);
          fill-opacity: 0;
          stroke: var(--cb-ink);
          stroke-width: 3;
          stroke-linejoin: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation:
            cb-draw 1.1s cubic-bezier(0.65, 0, 0.35, 1) forwards,
            cb-fill 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.75s forwards;
        }

        .cb-wordmark,
        .cb-caption,
        .cb-track {
          opacity: 0;
          animation: cb-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .cb-wordmark {
          animation-delay: 0.35s;
        }
        .cb-track {
          background: var(--cb-track);
          animation-delay: 0.5s;
        }
        .cb-caption {
          color: var(--cb-muted);
          animation-delay: 0.6s;
        }
        .cb-sweep {
          background: var(--cb-accent);
          animation: cb-sweep 1.6s cubic-bezier(0.45, 0, 0.25, 1) infinite;
        }

        @keyframes cb-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes cb-fill {
          to {
            fill-opacity: 1;
            stroke-width: 0;
          }
        }
        @keyframes cb-rise {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes cb-sweep {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(300%);
          }
        }
        @keyframes cb-breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.035);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cb-mark,
          .cb-sweep {
            animation: none;
          }
          .cb-mark-path {
            animation: none;
            stroke-dashoffset: 0;
            fill-opacity: 1;
            stroke-width: 0;
          }
          .cb-wordmark,
          .cb-caption,
          .cb-track {
            animation: none;
            opacity: 1;
          }
          .cb-loader {
            transition: opacity ${EXIT_MS}ms linear;
          }
          .cb-loader--leaving {
            filter: none;
          }
        }
      `}</style>
    </div>
  );
}
