/**
 * Islamic geometric helpers — the 8-point star (khatam / Rub el Hizb) formed
 * by two overlapping squares, drawn as a single outline.
 */

/** Outline path of an 8-point star centred on (cx, cy). `r` = outer radius. */
export function eightPointStar(cx: number, cy: number, r: number): string {
  // Two squares with half-side a: outer points at a√2, inner notches at a·√(4−2√2).
  const a = r / Math.SQRT2;
  const inner = a * Math.sqrt(4 - 2 * Math.SQRT2);
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    pts.push(`${(cx + rad * Math.cos(angle)).toFixed(2)} ${(cy + rad * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/**
 * A tiling lattice of 8-point stars joined by straight connectors —
 * a quiet, classic girih-style field. Returns one path for the whole area.
 */
export function starLattice(width: number, height: number, tile: number): string {
  const r = tile * 0.3;
  const cols = Math.ceil(width / tile) + 1;
  const rows = Math.ceil(height / tile) + 1;
  const d: string[] = [];
  const diag = r * Math.SQRT1_2;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * tile;
      const cy = row * tile;
      d.push(eightPointStar(cx, cy, r));
      // orthogonal connectors to the next star (right / down)
      d.push(`M${cx + r} ${cy} L${cx + tile - r} ${cy}`);
      d.push(`M${cx} ${cy + r} L${cx} ${cy + tile - r}`);
      // diagonal connectors meeting in the cell centre form small squares
      const mx = cx + tile / 2;
      const my = cy + tile / 2;
      d.push(`M${cx + diag} ${cy + diag} L${mx} ${my}`);
      d.push(`M${cx + tile - diag} ${cy + diag} L${mx} ${my}`);
      d.push(`M${cx + diag} ${cy + tile - diag} L${mx} ${my}`);
      d.push(`M${cx + tile - diag} ${cy + tile - diag} L${mx} ${my}`);
    }
  }
  return d.join(' ');
}
