// Brand-adjacent placeholder colors + glyphs per tool. NOT official logos —
// real SVG marks should be dropped in later as assets.
export interface Brand {
  color: string;
  glyph: string;
}

const BRANDS: Record<string, Brand> = {
  git: { color: '#F04E36', glyph: 'git' },
  wrangler: { color: '#F38020', glyph: 'wr' },
  codex: { color: '#10A37F', glyph: 'cx' },
  claude: { color: '#CC785C', glyph: 'cl' },
  npm: { color: '#CB3837', glyph: 'npm' },
  aws: { color: '#232F3E', glyph: 'aws' },
  docker: { color: '#1D63ED', glyph: 'dk' },
};

const FALLBACK_COLOR = '#8a8279';

export function brandFor(toolId: string, fallbackGlyph: string): Brand {
  const found = BRANDS[toolId];
  if (found) return found;
  return { color: FALLBACK_COLOR, glyph: fallbackGlyph };
}
