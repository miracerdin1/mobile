export const withAlpha = (hex: string, alphaHex: string) =>
  /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alphaHex}` : hex;

/** sRGB hex → 0..1 components (no colour-space conversion), for shader uniforms. */
export const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.4, 0.45, 0.52];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
