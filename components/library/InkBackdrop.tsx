import { useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

import { hexToRgb } from "../../utils/color";
import type { StageState } from "./stage";

/**
 * Ink drifting across paper, drawn as a full-screen quad behind the shelves
 * in the same canvas (no second WebGL context). The vertex shader ignores
 * the camera, so it always fills the viewport; renderOrder puts it first
 * and depth writes are off so everything else draws over it.
 */

export interface InkBackdropProps {
  stage: MutableRefObject<StageState>;
  reduceMotion: boolean;
  paper: string;
  inkA: string;
  inkB: string;
}

const VERT = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uTouch;
  uniform float uTouchOn;
  uniform vec3 uPaper;
  uniform vec3 uInkA;
  uniform vec3 uInkB;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int k = 0; k < 3; k++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv * vec2(aspect, 1.0) * 3.0;
    float t = uTime * 0.05;
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t * 0.7));
    vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.4), fbm(p + 3.5 * q + vec2(8.3, 2.8) - t * 0.3));
    float f = fbm(p + 3.0 * r);

    vec2 tp = (vec2(uTouch.x, 1.0 - uTouch.y) - uv) * vec2(aspect, 1.0);
    float d = length(tp);
    f += uTouchOn * 0.3 * exp(-d * d * 9.0) * sin(d * 30.0 - uTime * 3.0);

    vec3 ink = mix(uInkA, uInkB, smoothstep(0.35, 0.75, r.x));
    float body = smoothstep(0.42, 0.78, f);
    float vein = smoothstep(0.02, 0.0, abs(f - 0.58)) * 0.35;
    vec3 col = mix(uPaper, ink, body * 0.55 + vein * 0.9);
    col -= (hash(gl_FragCoord.xy) - 0.5) * 0.01;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function InkBackdrop({ stage, reduceMotion, paper, inkA, inkB }: InkBackdropProps) {
  const { size, gl } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 6.0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uTouch: { value: new THREE.Vector2(0.5, 0.5) },
      uTouchOn: { value: 0 },
      uPaper: { value: new THREE.Vector3(...hexToRgb(paper)) },
      uInkA: { value: new THREE.Vector3(...hexToRgb(inkA)) },
      uInkB: { value: new THREE.Vector3(...hexToRgb(inkB)) },
    }),
    [paper, inkA, inkB],
  );

  useFrame((_, delta) => {
    const u = material.current?.uniforms;
    if (!u) return;
    const s = stage.current;
    const dpr = gl.getPixelRatio();
    u.uRes.value.set(size.width * dpr, size.height * dpr);
    if (!reduceMotion) u.uTime.value += delta;
    if (s.touch) u.uTouch.value.set(s.touch.x, s.touch.y);
    u.uTouchOn.value += ((s.touch && !reduceMotion ? 1 : 0) - u.uTouchOn.value) * Math.min(1, delta * 10);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
