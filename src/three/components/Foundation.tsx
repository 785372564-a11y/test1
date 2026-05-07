import { useMemo } from 'react';
import ConcreteBox from './ConcreteBox';
import RebarGroup from './RebarGroup';
import { buildFoundation } from '@/pingfa/builders/foundationBuilder';
import { useModelStore } from '@/store/modelStore';
import { useRegisterBuiltRebars } from '@/store/builtCache';

const SCALE = 0.001;

export default function Foundation() {
  const params = useModelStore((s) => s.foundation);
  const built = useMemo(() => buildFoundation(params), [params]);
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
