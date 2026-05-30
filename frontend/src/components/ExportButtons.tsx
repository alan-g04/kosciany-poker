import { useGameStore } from '../game/store';
import { exportCSV } from '../utils/exporters';

export function ExportButtons() {
  const players = useGameStore((s) => s.players);
  return (
    <div className="flex gap-2">
      <button type="button" className="btn btn-ghost text-sm" onClick={() => exportCSV(players)}>
        Export CSV
      </button>
    </div>
  );
}
