import { useMemo } from 'react';
import ConcreteBox from './ConcreteBox';
import RebarGroup from './RebarGroup';
import { buildBeam } from '@/pingfa/builders/beamBuilder';
import { useModelStore } from '@/store/modelStore';
import { useRegisterBuiltRebars } from '@/store/builtCache';

const SCALE = 0.001;

export default function Beam() {
  const params = useModelStore((s) => s.beam);
  const built = useMemo(() => buildBeam(params), [params]);
  useRegisterBuiltRebars(built.rebars);

  // 局部坐标：x 跨方向（已居中），y 0=底，z 居中。
  // 把梁底贴 y=0 → 整体 y 上抬 0
  const c = built.concrete;
  const sw = params.supportWidth;
  // 支座柱高度：梁顶以上+下都伸出一段，让弯锚自然包住
  const colHeight = c.height + 800;
  const colY = colHeight / 2 - 400; // 让柱中段对齐梁中段
  return (
    <group>
      {/* 左右支座柱（示意） */}
      <ConcreteBox
        size={[sw, colHeight, c.width]}
        position={[(-c.length / 2 - sw / 2) * SCALE, colY * SCALE, 0]}
      />
      <ConcreteBox
        size={[sw, colHeight, c.width]}
        position={[(c.length / 2 + sw / 2) * SCALE, colY * SCALE, 0]}
      />
      {/* 梁本身 */}
      <ConcreteBox
        size={[c.length, c.height, c.width]}
        position={[0, (c.height / 2) * SCALE, 0]}
      />
      <RebarGroup rebars={built.rebars} />
    </group>
  );
}
