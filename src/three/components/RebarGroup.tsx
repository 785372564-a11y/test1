import RebarMesh from '@/three/rebar/RebarMesh';
import type { Rebar } from '@/three/rebar/types';
import { useViewStore } from '@/store/viewStore';

interface Props { rebars: Rebar[]; }

export default function RebarGroup({ rebars }: Props) {
  const showRebar = useViewStore((s) => s.showRebar);
  const showStirrups = useViewStore((s) => s.showStirrups);
  const showLong = useViewStore((s) => s.showLongitudinal);
  if (!showRebar) return null;
  return (
    <group>
      {rebars.map((r) => {
        if (r.role === 'stirrup' && !showStirrups) return null;
        if (r.role !== 'stirrup' && !showLong) return null;
        return <RebarMesh key={r.id} rebar={r} />;
      })}
    </group>
  );
}
