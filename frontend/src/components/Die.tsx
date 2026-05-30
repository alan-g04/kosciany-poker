import { useEffect, useRef, useState } from 'react';
import { DieFace } from '../game/types';

const PIP_POSITIONS: Record<DieFace, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
};

const ROLL_DURATION_MS = 900;
const FACE_FLICKER_INTERVAL_MS = 70;

interface DieProps {
  face: DieFace;
  size?: number;
  onClick?: () => void;
  active?: boolean;
  /** When this number changes, the die plays a spin animation, then locks to `face`. */
  rollKey?: number;
}

function randomFace(): DieFace {
  return ((Math.floor(Math.random() * 6) + 1) as DieFace);
}

export function Die({ face, size = 72, onClick, active = false, rollKey }: DieProps) {
  const interactive = !!onClick;
  const [displayFace, setDisplayFace] = useState<DieFace>(face);
  const [rolling, setRolling] = useState(false);
  const prevKey = useRef<number | undefined>(rollKey);

  // Reflect external face changes when not animating.
  useEffect(() => {
    if (!rolling) setDisplayFace(face);
  }, [face, rolling]);

  // When rollKey ticks, run the spin.
  useEffect(() => {
    if (rollKey === undefined) return;
    if (prevKey.current === rollKey) return;
    prevKey.current = rollKey;

    setRolling(true);
    const flicker = window.setInterval(() => {
      setDisplayFace(randomFace());
    }, FACE_FLICKER_INTERVAL_MS);
    const stop = window.setTimeout(() => {
      window.clearInterval(flicker);
      setDisplayFace(face);
      setRolling(false);
    }, ROLL_DURATION_MS);
    return () => {
      window.clearInterval(flicker);
      window.clearTimeout(stop);
    };
  }, [rollKey, face]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive || rolling}
      className={`relative rounded-xl shadow-die ${
        interactive && !rolling
          ? 'transition-transform hover:-translate-y-0.5 active:translate-y-0'
          : ''
      } ${active ? 'ring-2 ring-amber-400/70' : ''} ${rolling ? 'die-rolling' : ''}`}
      style={{
        width: size,
        height: size,
        background:
          'linear-gradient(155deg, #fbf6e6 0%, #f5efe1 55%, #e9dec3 100%)',
        border: '1px solid rgba(13,36,23,0.45)',
        transformStyle: 'preserve-3d',
      }}
      aria-label={`Die showing ${displayFace}`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="absolute inset-0"
        aria-hidden
      >
        {PIP_POSITIONS[displayFace].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={9}
            fill="#0d2417"
            opacity={0.92}
          />
        ))}
      </svg>
    </button>
  );
}
