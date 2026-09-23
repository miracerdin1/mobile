import * as THREE from "three";

import { hexToRgb } from "../../utils/color";

/**
 * "Banded classic" bindings, built as raw pixel arrays so they work the same
 * on native (expo-gl has no 2D canvas) and web. One small texture per face
 * keeps each book at a single draw call for its spine and its cover.
 *
 * Rows are measured from the top of the face (0) to the bottom (1); a
 * DataTexture's first row is the bottom of the plane, so rows are flipped
 * when written.
 */

const SPINE = { width: 16, height: 128 } as const;
const COVER = { width: 32, height: 128 } as const;

/** Paper bands across the spine, as [top, bottom] fractions. */
const SPINE_BANDS: Array<[number, number]> = [
  [0.1, 0.17],
  [0.8, 0.87],
];
/** Thin title rules between the bands, drawn over the middle of the spine. */
const SPINE_RULES: Array<[number, number]> = [
  [0.4, 0.415],
  [0.46, 0.475],
];
/** Colour bands at the top and bottom of the front cover. */
export const COVER_BAND = 0.2;

type Rgb = [number, number, number];

const toBytes = (hex: string): Rgb => hexToRgb(hex).map((v) => Math.round(v * 255)) as Rgb;

const within = (t: number, ranges: Array<[number, number]>) => ranges.some(([a, b]) => t >= a && t < b);

function paint(width: number, height: number, pixel: (u: number, t: number) => Rgb): THREE.DataTexture {
  const data = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row++) {
    const t = 1 - (row + 0.5) / height;
    for (let col = 0; col < width; col++) {
      const [r, g, b] = pixel((col + 0.5) / width, t);
      const i = (row * width + col) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

const blend = (a: Rgb, b: Rgb, k: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * k),
  Math.round(a[1] + (b[1] - a[1]) * k),
  Math.round(a[2] + (b[2] - a[2]) * k),
];

/** Spine: binding colour with two paper bands and two faint title rules. */
export function makeSpineTexture(color: string, paper: string) {
  const ink = toBytes(color);
  const sheet = toBytes(paper);
  const rule = blend(ink, sheet, 0.55);
  return paint(SPINE.width, SPINE.height, (u, t) => {
    if (within(t, SPINE_BANDS)) return sheet;
    if (u > 0.3 && u < 0.7 && within(t, SPINE_RULES)) return rule;
    return ink;
  });
}

/** Front cover: colour bands top and bottom, paper between, a short rule under the (unprinted) title. */
export function makeCoverTexture(color: string, paper: string) {
  const ink = toBytes(color);
  const sheet = toBytes(paper);
  return paint(COVER.width, COVER.height, (u, t) => {
    if (t < COVER_BAND || t >= 1 - COVER_BAND) return ink;
    if (u > 0.38 && u < 0.62 && t >= 0.56 && t < 0.57) return ink;
    return sheet;
  });
}
