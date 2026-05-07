import * as THREE from 'three';
import { makeRibbedSteelNormalMap } from './textures';
import type { RebarRole, RebarGrade } from '@/three/rebar/types';

let ribbedNormal: THREE.Texture | null = null;
function getRibbedNormal() {
  if (!ribbedNormal) ribbedNormal = makeRibbedSteelNormalMap();
  return ribbedNormal;
}

export const ROLE_COLORS: Record<RebarRole, string> = {
  topMain: '#ef4444',
  bottomMain: '#3b82f6',
  sideStruct: '#facc15',
  sideTorsion: '#f59e0b',
  erection: '#22d3ee',
  stirrup: '#22c55e',
  longitudinal: '#a855f7',
  slabTop: '#ef4444',
  slabBottom: '#3b82f6',
  wallVertical: '#a855f7',
  wallHorizontal: '#22c55e',
  foundationBottom: '#3b82f6',
};

const cache = new Map<string, THREE.MeshPhysicalMaterial>();

export interface SteelMatOpts {
  role: RebarRole;
  grade: RebarGrade;
  mode: 'role' | 'realistic';
}

export function getSteelMaterial({ role, grade, mode }: SteelMatOpts): THREE.MeshPhysicalMaterial {
  const key = `${role}|${grade}|${mode}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const isRibbed = grade !== 'HPB300';
  const baseColor = mode === 'role' ? ROLE_COLORS[role] : '#9aa0a6';
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(baseColor),
    metalness: mode === 'role' ? 0.5 : 0.85,
    roughness: mode === 'role' ? 0.45 : 0.5,
    clearcoat: mode === 'realistic' ? 0.15 : 0,
    clearcoatRoughness: 0.4,
    envMapIntensity: 1.0,
  });
  if (isRibbed) {
    const n = getRibbedNormal().clone();
    n.needsUpdate = true;
    n.repeat.set(8, 1);
    m.normalMap = n;
    m.normalScale.set(0.6, 0.6);
  }
  cache.set(key, m);
  return m;
}
