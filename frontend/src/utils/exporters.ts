import {
  BOTTOM_CATEGORY_IDS,
  CATEGORY_LABEL,
  PlayerScorecard,
  TOP_CATEGORY_IDS,
} from '../game/types';
import { calculatePlayerTotals } from '../game/gameLogic';

function cellText(entry: { value: number; crossedOut: boolean } | undefined): string {
  if (!entry) return '';
  if (entry.crossedOut) return 'X';
  return String(entry.value);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCSV(players: PlayerScorecard[]): void {
  const lines: string[] = [];
  lines.push(['Player', 'Section', 'Category', 'Col 1', 'Col 2', 'Col 3'].map(csvEscape).join(','));

  for (const p of players) {
    for (const cat of TOP_CATEGORY_IDS) {
      lines.push(
        [
          p.name,
          'Top',
          CATEGORY_LABEL[cat],
          cellText(p.columns[0][cat]),
          cellText(p.columns[1][cat]),
          cellText(p.columns[2][cat]),
        ]
          .map(csvEscape)
          .join(','),
      );
    }
    for (const cat of BOTTOM_CATEGORY_IDS) {
      lines.push(
        [
          p.name,
          'Bottom',
          CATEGORY_LABEL[cat],
          cellText(p.columns[0][cat]),
          cellText(p.columns[1][cat]),
          cellText(p.columns[2][cat]),
        ]
          .map(csvEscape)
          .join(','),
      );
    }

    const totals = calculatePlayerTotals(p);
    lines.push(
      [
        p.name,
        'Totals',
        'Top raw',
        ...totals.columns.map((c) => String(c.topRaw)),
      ]
        .map(csvEscape)
        .join(','),
    );
    lines.push(
      [p.name, 'Totals', 'Top bonus', ...totals.columns.map((c) => String(c.topBonus))]
        .map(csvEscape)
        .join(','),
    );
    lines.push(
      [p.name, 'Totals', 'Bottom raw', ...totals.columns.map((c) => String(c.bottomRaw))]
        .map(csvEscape)
        .join(','),
    );
    lines.push(
      [p.name, 'Totals', 'Column bonus', ...totals.columns.map((c) => String(c.columnBonus))]
        .map(csvEscape)
        .join(','),
    );
    lines.push(
      [p.name, 'Totals', 'Column total', ...totals.columns.map((c) => String(c.total))]
        .map(csvEscape)
        .join(','),
    );
    lines.push([p.name, 'Totals', 'Grand total', String(totals.grandTotal), '', ''].map(csvEscape).join(','));
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `kosciany-poker-${Date.now()}.csv`);
}

