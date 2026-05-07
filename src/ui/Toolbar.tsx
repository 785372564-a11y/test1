import { useModelStore, type ComponentKind } from '@/store/modelStore';
import { useViewStore } from '@/store/viewStore';
import { Boxes, Palette, Wrench } from 'lucide-react';

const TABS: { kind: ComponentKind; label: string; icon: any }[] = [
  { kind: 'beam', label: '梁 KL', icon: Boxes },
];

export default function Toolbar() {
  const kind = useModelStore((s) => s.kind);
  const setKind = useModelStore((s) => s.setKind);
  const renderMode = useViewStore((s) => s.renderMode);
  const set = useViewStore((s) => s.set);
  return (
    <div className="absolute top-4 left-4 right-4 flex items-center gap-2 z-10 pointer-events-none">
      <div className="panel pointer-events-auto flex items-center gap-2 px-3 py-1.5">
        <Wrench size={14} className="text-sky-400" />
        <span className="text-sm font-semibold tracking-wide">钢筋平法 3D</span>
        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">22G101</span>
      </div>

      <div className="panel pointer-events-auto flex items-center gap-1 px-1.5 py-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = kind === t.kind;
          return (
            <button
              key={t.kind}
              onClick={() => setKind(t.kind)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-sm transition ${
                active ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="panel pointer-events-auto flex items-center gap-1 px-1.5 py-1 text-sm">
        <Palette size={14} className="text-slate-400 ml-1" />
        <button
          onClick={() => set({ renderMode: 'role' })}
          className={`px-2.5 py-1 rounded transition ${renderMode === 'role' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >配色</button>
        <button
          onClick={() => set({ renderMode: 'realistic' })}
          className={`px-2.5 py-1 rounded transition ${renderMode === 'realistic' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >金属</button>
      </div>
    </div>
  );
}
