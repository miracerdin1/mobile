export const withAlpha = (hex: string, alphaHex: string) =>
  /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alphaHex}` : hex;

/** sRGB hex → 0..1 components (no colour-space conversion), for shader uniforms. */
export const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.4, 0.45, 0.52];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Linear blend of two `#rrggbb` colours, `t` = 0 → `a`, 1 → `b`. */
export const mixHex = (a: string, b: string, t: number): string => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const channel = (i: number) =>
    Math.round((A[i] + (B[i] - A[i]) * t) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}`;
};
