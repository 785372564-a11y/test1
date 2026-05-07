import { useModelStore, type ComponentKind } from '@/store/modelStore';
import { useViewStore } from '@/store/viewStore';
import { Boxes, Palette } from 'lucide-react';

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
      <div className="panel pointer-events-auto flex items-center gap-3 pl-2 pr-4 py-1.5 shadow-2xl ring-1 ring-sky-500/30">
        <img
          src={`${import.meta.env.BASE_URL}logo-mark-alpha.png`}
          alt="logo"
          className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.55)]"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-wide bg-gradient-to-r from-emerald-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
            新旅建设集团
          </span>
          <span className="text-[11px] text-slate-400 tracking-wider">XINLV · 钢筋平法 3D · 22G101</span>
        </div>
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
