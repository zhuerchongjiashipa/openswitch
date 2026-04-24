import { CSSProperties } from 'react';
import { Brand, brandFor } from './brand';
import { OS_TOKENS } from './data';

interface Props {
  toolId: string;
  fallbackGlyph?: string;
  size?: number;
  radius?: number;
  title?: string;
}

export function BrandTile({
  toolId,
  fallbackGlyph = '•',
  size = 22,
  radius = 5,
  title,
}: Props) {
  const b: Brand = brandFor(toolId, fallbackGlyph);
  const fontSize = Math.max(9, Math.round(size * 0.38));
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    background: b.color,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: OS_TOKENS.mono,
    fontSize,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    boxShadow:
      'inset 0 -1px 0 rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
  };
  return (
    <div style={style} title={title}>
      <span style={{ mixBlendMode: 'screen', opacity: 0.95 }}>{b.glyph}</span>
    </div>
  );
}
