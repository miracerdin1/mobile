export const withAlpha = (hex: string, alphaHex: string) =>
  /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alphaHex}` : hex;
