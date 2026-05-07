import { useMemo } from 'react';
import ConcreteBox from './ConcreteBox';
import RebarGroup from './RebarGroup';
import { buildWall } from '@/pingfa/builders/wallBuilder';
import { useModelStore } from '@/store/modelStore';
import { useRegisterBuiltRebars } from '@/store/builtCache';

const SCALE = 0.001;

export default function Wall() {
  const params = useModelStore((s) => s.wall);
  const built = useMemo(() => buildWall(params), [params]);
  useRegisterBuiltRebars(built.rebars);
  const c = built.concrete;
  return (
    <group>
      <ConcreteBox
        size={[c.length, c.height, c.thickness]}
        position={[0, (c.height / 2) * SCALE, 0]}
      />
      <RebarGroup rebars={built.rebars} />
    </group>
  );
}
