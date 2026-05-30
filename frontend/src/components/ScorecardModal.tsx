import { useEffect } from 'react';
import { PlayerScorecard } from '../game/types';
import { ScorecardGrid } from './ScorecardGrid';

interface ScorecardModalProps {
  player: PlayerScorecard;
  readOnly: boolean;
  onClose: () => void;
}

export function ScorecardModal({ player, readOnly, onClose }: ScorecardModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-felt-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`${player.name}'s scorecard`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200/80">
            {readOnly ? 'Read-only · viewing' : 'Active · pick a cell to log'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-sm"
            aria-label="Close scorecard"
          >
            Close ✕
          </button>
        </div>
        <ScorecardGrid player={player} readOnly={readOnly} onScored={onClose} />
      </div>
    </div>
  );
}
