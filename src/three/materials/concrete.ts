import * as THREE from 'three';
import { makeConcreteNormalMap } from './textures';

let normalTex: THREE.Texture | null = null;
let cached: THREE.MeshStandardMaterial | null = null;
let cachedOpacity = -1;
let cachedVisible = true;

export function getConcreteMaterial(opacity: number, visible = true): THREE.MeshStandardMaterial {
  if (cached && Math.abs(cachedOpacity - opacity) < 1e-3 && cachedVisible === visible) return cached;
  if (!normalTex) normalTex = makeConcreteNormalMap();
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#cbc6bd'),
    roughness: 0.88,
    metalness: 0.0,
    normalMap: normalTex,
    normalScale: new THREE.Vector2(0.4, 0.4),
    transparent: opacity < 0.99,
    opacity,
    depthWrite: opacity > 0.95,
    side: THREE.DoubleSide,
    visible,
  });
  cached = m;
  cachedOpacity = opacity;
  cachedVisible = visible;
  return m;
}
