import { useMemo } from 'react';
import ConcreteBox from './ConcreteBox';
import RebarGroup from './RebarGroup';
import { buildColumn } from '@/pingfa/builders/columnBuilder';
import { useModelStore } from '@/store/modelStore';
import { useRegisterBuiltRebars } from '@/store/builtCache';

const SCALE = 0.001;

export default function Column() {
  const params = useModelStore((s) => s.column);
  const built = useMemo(() => buildColumn(params), [params]);
  useRegisterBuiltRebars(built.rebars);
  const c = built.concrete;
  return (
    <group>
      <ConcreteBox
        size={[c.width, c.height, c.depth]}
        position={[0, (c.height / 2) * SCALE, 0]}
      />
      <RebarGroup rebars={built.rebars} />
    </group>
  );
}
