import { useMemo } from 'react';
import ConcreteBox from './ConcreteBox';
import RebarGroup from './RebarGroup';
import { buildSlab } from '@/pingfa/builders/slabBuilder';
import { useModelStore } from '@/store/modelStore';
import { useRegisterBuiltRebars } from '@/store/builtCache';

const SCALE = 0.001;

export default function Slab() {
  const params = useModelStore((s) => s.slab);
  const built = useMemo(() => buildSlab(params), [params]);
  useRegisterBuiltRebars(built.rebars);
  const c = built.concrete;
  return (
    <group>
      <ConcreteBox
        size={[c.lengthX, c.thickness, c.lengthY]}
        position={[0, (c.thickness / 2) * SCALE, 0]}
      />
      <RebarGroup rebars={built.rebars} />
    </group>
  );
}
