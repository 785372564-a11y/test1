import { ROLE_COLORS } from '@/three/materials/steel';
import { useViewStore } from '@/store/viewStore';

const ITEMS: { role: keyof typeof ROLE_COLORS; label: string }[] = [
  { role: 'topMain', label: '上部受力' },
  { role: 'bottomMain', label: '下部受力' },
  { role: 'stirrup', label: '箍筋' },
];

export default function Legend() {
  const mode = useViewStore((s) => s.renderMode);
  if (mode !== 'role') return null;
  return (
    <div className="absolute bottom-4 left-4 panel px-3 py-2 z-10 text-[11px] flex items-center gap-3">
      {ITEMS.map((it) => (
        <div key={it.role} className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: ROLE_COLORS[it.role] }} />
          <span className="text-slate-300">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
