import { useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import type { SharedValue } from "react-native-reanimated";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { COVER_BAND, makeCoverTexture, makeSpineTexture } from "./bookTextures";
import InkBackdrop from "./InkBackdrop";
import {
  SHELF,
  VIEW,
  type Book,
  type LabelAnchor,
  type Library,
  type LibraryPalette,
  type StageBridge,
  type StageState,
} from "./stage";

/**
 * The room: ink-on-paper backdrop, one plank per shelf, one book per link.
 * The camera pans along the shelves; a pulled book slides forward and turns
 * to show its cover. Shelf labels are projected to screen space each frame
 * for the RN overlay.
 */

export interface LibrarySceneProps {
  library: Library;
  stage: MutableRefObject<StageState>;
  bridge: MutableRefObject<StageBridge | null>;
  labelAnchors: SharedValue<LabelAnchor>[];
  reduceMotion: boolean;
  palette: LibraryPalette;
}

const tmp = new THREE.Vector3();
const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
/** Room a label pill needs to the right of its anchor (px). */
const LABEL_WIDTH = 150;
/** Covers past this many books are not fetched; spines still show. */
const MAX_COVERS = 80;

export default function LibraryScene({ library, stage, bridge, labelAnchors, reduceMotion, palette }: LibrarySceneProps) {
  const { camera, gl, scene, size, invalidate } = useThree();
  const bookRefs = useRef<Array<THREE.Group | null>>([]);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const lightTarget = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    let texture: THREE.Texture | null = null;
    try {
      const pmrem = new THREE.PMREMGenerator(gl);
      texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = texture;
      pmrem.dispose();
    } catch (err) {
      console.warn("Library: environment map unavailable", err);
    }
    invalidate();
    return () => {
      scene.environment = null;
      texture?.dispose();
    };
  }, [gl, scene, invalidate]);

  const pick = (px: number, py: number): number | null => {
    let best: number | null = null;
    let bestDepth = Infinity;
    library.books.forEach((book, i) => {
      const g = bookRefs.current[i];
      if (!g) return;
      g.updateWorldMatrix(true, false);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let depth = 0;
      for (let k = 0; k < 8; k++) {
        const c = corners[k].set(
          (k & 1 ? 0.5 : -0.5) * book.width,
          (k & 2 ? 0.5 : -0.5) * book.height,
          (k & 4 ? 0.5 : -0.5) * SHELF.bookDepth,
        );
        g.localToWorld(c).project(camera);
        const x = ((c.x + 1) / 2) * size.width;
        const y = ((1 - c.y) / 2) * size.height;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        depth += c.z / 8;
      }
      const pad = 4;
      if (px < minX - pad || px > maxX + pad || py < minY - pad || py > maxY + pad) return;
      if (depth < bestDepth) {
        bestDepth = depth;
        best = i;
      }
    });
    return best;
  };

  useLayoutEffect(() => {
    bridge.current = { pick, invalidate };
    return () => {
      bridge.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge, camera, invalidate, library, size.height, size.width]);

  useFrame((_, delta) => {
    const s = stage.current;
    const frames = Math.min(delta * 60, 3);
    const ease = (k: number) => 1 - Math.pow(1 - k, frames);
    if (!reduceMotion) s.time += delta;

    // --- Pan with inertia, clamped to the shelving ------------------------------
    const b = library.bounds;
    if (!s.interacting && Math.abs(s.velX) > 1e-4) {
      s.targetX += s.velX * frames;
      s.velX *= Math.pow(VIEW.inertiaDecay, frames);
    }
    // Horizontal range: the view centre may travel from one plank end to the
    // other, but never past them; a shelf narrower than the view stays put.
    const halfV = THREE.MathUtils.degToRad(VIEW.fov / 2);
    const visibleHalf = VIEW.offset.z * Math.tan(halfV) * (size.width / size.height);
    const reach = Math.max(0, library.maxWidth / 2 - visibleHalf + 0.4);
    s.targetX = THREE.MathUtils.clamp(s.targetX, -reach - VIEW.aimX, reach - VIEW.aimX);
    s.targetY = THREE.MathUtils.clamp(s.targetY, b.minY, b.maxY);
    s.aimX += (s.targetX - s.aimX) * ease(0.14);
    s.aimY += (s.targetY - s.aimY) * ease(0.14);

    camera.position.set(s.aimX + VIEW.offset.x, s.aimY + VIEW.offset.y, VIEW.offset.z);
    camera.lookAt(s.aimX + VIEW.aimX, s.aimY + VIEW.aimY, 0);

    // The key light follows the view so shadows stay crisp everywhere.
    const light = lightRef.current;
    if (light) {
      light.position.set(s.aimX + 3, s.aimY + 7, 6);
      lightTarget.position.set(s.aimX, s.aimY, 0);
      lightTarget.updateMatrixWorld();
    }

    // --- Books: pulled one slides out and turns --------------------------------
    let settling = false;
    library.books.forEach((book, i) => {
      const g = bookRefs.current[i];
      if (!g) return;
      const pulled = s.pulled === i;
      const tz = pulled ? SHELF.pullOut : 0;
      const tr = pulled ? SHELF.pullTurn : 0;
      g.position.z += (tz - g.position.z) * ease(0.14);
      g.rotation.y += (tr - g.rotation.y) * ease(0.14);
      if (Math.abs(tz - g.position.z) > 1e-3) settling = true;
    });

    // --- Shelf labels ---------------------------------------------------------------
    library.shelves.forEach((shelf, i) => {
      const anchor = labelAnchors[i];
      if (!anchor) return;
      // Like a placard on the shelf's front edge, just under the plank.
      tmp.set(-shelf.width / 2 + 0.15, shelf.y - SHELF.plankThickness - 0.3, SHELF.plankDepth / 2).project(camera);
      const x = ((tmp.x + 1) / 2) * size.width;
      const y = ((1 - tmp.y) / 2) * size.height;
      anchor.value = {
        // A shelf that runs off the left edge keeps its label at the edge.
        x: Math.min(Math.max(x, 12), size.width - LABEL_WIDTH),
        y,
        visible: tmp.z < 1 && y > 0 && y < size.height,
      };
    });

    if (
      reduceMotion &&
      (settling || Math.abs(s.targetX - s.aimX) > 1e-3 || Math.abs(s.targetY - s.aimY) > 1e-3 || s.touch)
    ) {
      invalidate();
    }
  });

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <InkBackdrop stage={stage} reduceMotion={reduceMotion} paper={palette.background} inkA={palette.primary} inkB={palette.secondary} />
      <hemisphereLight args={["#ffffff", palette.background, 0.55]} />
      <directionalLight
        ref={lightRef}
        target={lightTarget}
        intensity={2.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={5}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <primitive object={lightTarget} />
      <ambientLight intensity={0.3} />

      {library.shelves.map((shelf) => (
        <ShelfPlank key={shelf.id} y={shelf.y} width={shelf.width} color={shelf.color} palette={palette} />
      ))}
      {library.books.map((book, i) => (
        <BookMesh
          key={book.link._id}
          book={book}
          shelfY={library.shelves[book.shelfIndex].y}
          palette={palette}
          loadCover={i < MAX_COVERS}
          ref={(el) => {
            bookRefs.current[i] = el;
          }}
        />
      ))}
    </>
  );
}

function ShelfPlank({ y, width, color, palette }: { y: number; width: number; color: string; palette: LibraryPalette }) {
  const geometry = useMemo(() => new RoundedBoxGeometry(width, SHELF.plankThickness, SHELF.plankDepth, 3, 0.04), [width]);
  return (
    <group position={[0, y - SHELF.plankThickness / 2, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.8} />
      </mesh>
      {/* Folder colour as a thin edge band on the plank's front. */}
      <mesh position={[0, 0, SHELF.plankDepth / 2 + 0.005]}>
        <boxGeometry args={[width, SHELF.plankThickness * 0.42, 0.01]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Back rail: keeps books from floating against the ink. */}
      <mesh position={[0, 0.9, -SHELF.plankDepth / 2 - 0.02]} receiveShadow>
        <boxGeometry args={[width, 1.9, 0.06]} />
        <meshStandardMaterial color={palette.paper} roughness={0.95} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

const BookMesh = React.forwardRef<
  THREE.Group,
  { book: Book; shelfY: number; palette: LibraryPalette; loadCover: boolean }
>(function BookMesh({ book, shelfY, palette, loadCover }, ref) {
  const { invalidate } = useThree();
  const geometry = useMemo(
    () => new RoundedBoxGeometry(book.width, book.height, SHELF.bookDepth, 3, 0.025),
    [book.width, book.height],
  );
  const spineMap = useMemo(() => makeSpineTexture(book.color, palette.paper), [book.color, palette.paper]);
  const coverMap = useMemo(() => makeCoverTexture(book.color, palette.paper), [book.color, palette.paper]);
  useEffect(() => () => spineMap.dispose(), [spineMap]);
  useEffect(() => () => coverMap.dispose(), [coverMap]);

  const coverWidth = SHELF.bookDepth - 0.03;
  const coverHeight = book.height - 0.03;
  /** The paper panel between the cover's colour bands, where a preview image sits. */
  const panelHeight = coverHeight * (1 - COVER_BAND * 2);
  const [image, setImage] = useState<THREE.Texture | null>(null);

  // The link's preview image, fitted into the cover's paper panel. When it
  // cannot be fetched (CORS on web, a dead URL) the plain banded cover stays.
  useEffect(() => {
    const url = book.link.imageUrl;
    if (!loadCover || !url || !/^https?:\/\//i.test(url)) return;
    let disposed = false;
    let loaded: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        // Cover-fit: crop the image to the panel's aspect instead of squashing.
        const img = texture.image as { width?: number; height?: number } | undefined;
        const panelAspect = coverWidth / panelHeight;
        if (img?.width && img?.height) {
          const imageAspect = img.width / img.height;
          if (imageAspect > panelAspect) {
            texture.repeat.set(panelAspect / imageAspect, 1);
            texture.offset.set((1 - panelAspect / imageAspect) / 2, 0);
          } else {
            texture.repeat.set(1, imageAspect / panelAspect);
            texture.offset.set(0, (1 - imageAspect / panelAspect) / 2);
          }
        }
        loaded = texture;
        setImage(texture);
        invalidate();
      },
      undefined,
      () => {
        // CORS or a dead image: the plain cover stays.
      },
    );
    return () => {
      disposed = true;
      loaded?.dispose();
      setImage(null);
    };
  }, [book.link.imageUrl, coverWidth, panelHeight, loadCover, invalidate]);

  return (
    <group ref={ref} position={[book.x, shelfY + book.height / 2, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={palette.paper} roughness={0.85} />
      </mesh>
      {/* Spine faces the viewer: binding colour with two paper bands. */}
      <mesh position={[0, 0, SHELF.bookDepth / 2 + 0.003]}>
        <planeGeometry args={[book.width - 0.03, book.height - 0.03]} />
        <meshStandardMaterial map={spineMap} roughness={0.55} />
      </mesh>
      {/* Front cover on the +x face, seen once the book is pulled and turned. */}
      <group position={[book.width / 2 + 0.003, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[coverWidth, coverHeight]} />
          <meshStandardMaterial map={coverMap} roughness={0.5} />
        </mesh>
        {image && (
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[coverWidth, panelHeight]} />
            <meshStandardMaterial map={image} roughness={0.5} />
          </mesh>
        )}
      </group>
    </group>
  );
});
