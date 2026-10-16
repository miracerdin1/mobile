import { CATEGORY_COLORS, CATEGORY_LABELS } from "../../constants";
import type { Link } from "../../types";
import { mixHex } from "../../utils/color";

/** World-space dimensions of the shelving. */
export const SHELF = {
  /** Vertical distance between shelf planks. */
  pitch: 2.75,
  plankThickness: 0.16,
  plankDepth: 2.3,
  /** Empty plank on either side of the row of books. */
  margin: 0.6,
  /** A shelf is never narrower than this, so short folders still read as shelves. */
  minWidth: 6,
  /** A category spills onto a new plank once a row would grow past this,
   *  so one big folder never turns into an endless single-row pan. */
  maxWidth: 10,
  bookGap: 0.06,
  bookDepth: 1.35,
  /** How far a pulled book slides toward the viewer, and how far it turns. */
  pullOut: 1.1,
  pullTurn: -0.85,
} as const;

export const VIEW = {
  fov: 34,
  /** Camera offset from the point it looks at; a three-quarter view from the right. */
  offset: { x: 2.4, y: 2.6, z: 19.5 },
  /** The camera aims a little right of and above the pan target, so the
   *  targeted shelf sits below screen centre with its books in full view. */
  aimX: 0.9,
  aimY: 0.9,
  panPerPx: 0.012,
  inertiaDecay: 0.92,
} as const;

/** Colours the scene shares, sourced from the app theme. */
export interface LibraryPalette {
  background: string;
  paper: string;
  ink: string;
  wood: string;
  primary: string;
  secondary: string;
}

/** One book: a link placed on a shelf. Geometry is fixed once laid out. */
export interface Book {
  link: Link;
  shelfIndex: number;
  /** Centre x along the shelf. */
  x: number;
  width: number;
  height: number;
  /** Binding colour: this link's shade of its category colour. */
  color: string;
}

/** One shelf: a link category. */
export interface Shelf {
  id: string;
  category: string;
  label: string;
  color: string;
  /** Centre y of the plank's top surface. */
  y: number;
  /** Plank spans x ∈ [-width/2, width/2]. */
  width: number;
  books: Book[];
}

export interface Library {
  shelves: Shelf[];
  books: Book[];
  /** Pan bounds for the camera target; x is refined per frame from the viewport. */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  /** Widest shelf, for the per-frame horizontal clamp. */
  maxWidth: number;
}

/** Links whose category is missing or unknown shelve here. */
export const FALLBACK_CATEGORY = "Other";

export const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * A per-link shade of the category colour, so a shelf reads as separate
 * books rather than one flat block. Uses hash bits the book size ignores.
 */
const bookTone = (color: string, h: number) => {
  const r = ((h >>> 9) % 100) / 100;
  return r < 0.5 ? mixHex(color, "#0E1422", r * 0.5) : mixHex(color, "#FFFFFF", (r - 0.5) * 0.45);
};

/** Catalogue number printed on the library card; stable per link. */
export const catalogNumber = (linkId: string) => (hash(linkId) % 9000) + 1000;

/**
 * Lays the archive out as shelving: one shelf per category in the user's
 * category order (the "All" tab is not a shelf; empty categories are
 * skipped), books in newest-first order. Book sizes vary deterministically
 * per link so the rows read as real shelves.
 */
export function buildLibrary(categories: string[], links: Link[]): Library {
  const order = categories.filter((c) => c !== "All");
  if (!order.includes(FALLBACK_CATEGORY)) order.push(FALLBACK_CATEGORY);
  const known = new Set(order);

  const byCategory = new Map<string, Link[]>();
  for (const link of links) {
    const category = link.category && known.has(link.category) ? link.category : FALLBACK_CATEGORY;
    const bucket = byCategory.get(category) ?? [];
    bucket.push(link);
    byCategory.set(category, bucket);
  }
  const newestFirst = (a: Link, b: Link) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "");

  const categoryRows = order
    .filter((category) => byCategory.has(category))
    .map((category) => ({
      id: category,
      category,
      label: CATEGORY_LABELS[category] ?? category,
      color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS[FALLBACK_CATEGORY],
      links: (byCategory.get(category) ?? []).sort(newestFirst),
    }));

  interface BookMeta {
    link: Link;
    width: number;
    height: number;
    hash: number;
  }
  interface PlankRow {
    id: string;
    category: string;
    label: string;
    color: string;
    items: BookMeta[];
  }

  // A long category spills onto extra planks once a row would grow past
  // SHELF.maxWidth, like a real shelf running out of room — this keeps any
  // single row (and so any single horizontal pan) bounded. Only the first
  // plank of a category carries its label; the rest read as its continuation.
  const plankRows: PlankRow[] = [];
  for (const row of categoryRows) {
    const items: BookMeta[] = row.links.map((link) => {
      const h = hash(link._id);
      return { link, width: 0.34 + (h % 5) * 0.07, height: 1.55 + ((h >> 3) % 4) * 0.12, hash: h };
    });
    let chunk: BookMeta[] = [];
    let cursor = 0;
    let part = 0;
    const flush = () => {
      plankRows.push({ id: `${row.id}#${part}`, category: row.category, label: part === 0 ? row.label : "", color: row.color, items: chunk });
      part += 1;
      chunk = [];
      cursor = 0;
    };
    for (const item of items) {
      if (chunk.length && cursor + item.width + SHELF.margin * 2 > SHELF.maxWidth) flush();
      chunk.push(item);
      cursor += item.width + SHELF.bookGap;
    }
    if (chunk.length) flush();
  }

  const shelves: Shelf[] = [];
  const books: Book[] = [];
  let maxWidth: number = SHELF.minWidth;
  plankRows.forEach((row, shelfIndex) => {
    const y = ((plankRows.length - 1) / 2 - shelfIndex) * SHELF.pitch;
    const rowBooks: Book[] = [];
    let cursor = 0;
    for (const item of row.items) {
      rowBooks.push({
        link: item.link,
        shelfIndex,
        x: cursor + item.width / 2,
        width: item.width,
        height: item.height,
        color: bookTone(row.color, item.hash),
      });
      cursor += item.width + SHELF.bookGap;
    }
    const rowWidth = Math.max(SHELF.minWidth, cursor - SHELF.bookGap + SHELF.margin * 2);
    // Books start at the shelf's left edge, after the margin.
    const start = -rowWidth / 2 + SHELF.margin;
    for (const b of rowBooks) b.x += start;
    maxWidth = Math.max(maxWidth, rowWidth);
    shelves.push({ id: row.id, category: row.category, label: row.label, color: row.color, y, width: rowWidth, books: rowBooks });
    books.push(...rowBooks);
  });

  const top = shelves[0]?.y ?? 0;
  const bottom = shelves[shelves.length - 1]?.y ?? 0;
  return {
    shelves,
    books,
    bounds: { minX: -maxWidth / 2, maxX: maxWidth / 2, minY: bottom, maxY: top },
    maxWidth,
  };
}

/** Mutable camera/interaction state shared by gestures and the render loop. */
export interface StageState {
  /** Point the camera orbits around; pans along and between shelves. */
  targetX: number;
  targetY: number;
  aimX: number;
  aimY: number;
  velX: number;
  interacting: boolean;
  /** Index into `books`, or null. */
  pulled: number | null;
  /** Finger in normalised device coords while down, for the ink ripple. */
  touch: { x: number; y: number } | null;
  time: number;
  gesture: { startX: number; startY: number; moved: boolean };
}

export const createStageState = (library: Library): StageState => {
  const y = library.bounds.maxY;
  return {
    targetX: library.bounds.minX,
    targetY: y,
    aimX: library.bounds.minX,
    aimY: y,
    velX: 0,
    interacting: false,
    pulled: null,
    touch: null,
    time: 0,
    gesture: { startX: 0, startY: 0, moved: false },
  };
};

export interface StageBridge {
  /** Book index under a screen point (px, canvas-relative), or null. */
  pick: (px: number, py: number) => number | null;
  invalidate: () => void;
}

/** Screen-space anchor for a shelf label, written every frame. */
export interface LabelAnchor {
  x: number;
  y: number;
  visible: boolean;
}

export const MAX_SHELF_LABELS = 8;
