import { useMemo } from 'react';
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
  const mat = useMemo(() => getConcreteMaterial(opacity, visible), [opacity, visible]);
  const sz: [number, number, number] = [size[0] * scale, size[1] * scale, size[2] * scale];
  return (
    <mesh position={position} castShadow receiveShadow material={mat}>
      <boxGeometry args={sz} />
    </mesh>
  );
}
