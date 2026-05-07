import { useMemo } from 'react';
import * as THREE from 'three';
import { getConcreteMaterial } from '@/three/materials/concrete';
import { useViewStore } from '@/store/viewStore';

interface Props {
  /** 尺寸 mm */
  size: [number, number, number];
  /** 中心位置 m */
  position?: [number, number, number];
  scale?: number;
}

export default function ConcreteBox({ size, position = [0, 0, 0], scale = 0.001 }: Props) {
  const opacity = useViewStore((s) => s.concreteOpacity);
  const visible = useViewStore((s) => s.showConcrete);
  const clipEnabled = useViewStore((s) => s.clipEnabled);
  const clipAxis = useViewStore((s) => s.clipAxis);
  const clipPosition = useViewStore((s) => s.clipPosition);

  const mat = useMemo(() => getConcreteMaterial(opacity, visible), [opacity, visible]);
  const sz: [number, number, number] = [size[0] * scale, size[1] * scale, size[2] * scale];

  // 剖切：相对盒中心位置（-1..1 → -size/2..size/2 的世界单位）
  const plane = useMemo(() => new THREE.Plane(), []);
  if (clipEnabled) {
    const half = clipAxis === 'x' ? sz[0] / 2 : clipAxis === 'y' ? sz[1] / 2 : sz[2] / 2;
    const center = clipAxis === 'x' ? position[0] : clipAxis === 'y' ? position[1] : position[2];
    const worldPos = center + clipPosition * half;
    const normal = clipAxis === 'x'
      ? new THREE.Vector3(1, 0, 0)
      : clipAxis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
    plane.normal.copy(normal);
    plane.constant = -worldPos;
    mat.clippingPlanes = [plane];
    mat.clipShadows = true;
  } else {
    mat.clippingPlanes = null;
  }
  mat.needsUpdate = true;

  return (
    <mesh position={position} castShadow receiveShadow material={mat}>
      <boxGeometry args={sz} />
    </mesh>
  );
}
