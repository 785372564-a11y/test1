import { useModelStore } from '@/store/modelStore';
import { useViewStore } from '@/store/viewStore';
import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Settings2, Box } from 'lucide-react';
import BeamForm from './forms/BeamForm';
import ColumnForm from './forms/ColumnForm';
import SlabForm from './forms/SlabForm';
import WallForm from './forms/WallForm';
import FoundationForm from './forms/FoundationForm';

const TITLES: Record<string, string> = {
  beam: '梁 KL 参数', column: '柱 KZ 参数', slab: '板参数', wall: '剪力墙参数', foundation: '基础参数',
};

export default function ParamPanel() {
  const kind = useModelStore((s) => s.kind);
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        className="absolute top-20 left-4 z-10 panel w-10 h-10 grid place-items-center text-slate-300 hover:text-white"
        onClick={() => setCollapsed(false)}
        title="展开参数面板"
      >
        <PanelLeftOpen size={18} />
      </button>
    );
  }

  return (
    <div className="absolute top-20 left-4 z-10 w-[300px]">
      <div className="panel max-h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/60">
          <Settings2 size={14} className="text-sky-400" />
          <span className="text-sm font-semibold flex-1">{TITLES[kind] ?? '参数'}</span>
          <button className="btn-ghost" onClick={() => setCollapsed(true)} title="收起">
            <PanelLeftClose size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-3 text-sm flex-1">
          {kind === 'beam' && <BeamForm />}
          {kind === 'column' && <ColumnForm />}
          {kind === 'slab' && <SlabForm />}
          {kind === 'wall' && <WallForm />}
          {kind === 'foundation' && <FoundationForm />}
        </div>
        <ConcreteOpacityBar />
      </div>
    </div>
  );
}

function ConcreteOpacityBar() {
  const opacity = useViewStore((s) => s.concreteOpacity);
  const showConcrete = useViewStore((s) => s.showConcrete);
  const set = useViewStore((s) => s.set);
  return (
    <div className="border-t border-slate-700/60 px-3 py-2.5 bg-slate-900/40">
      <div className="flex items-center gap-2 mb-1.5">
        <button
          onClick={() => set({ showConcrete: !showConcrete })}
          className={`w-6 h-6 grid place-items-center rounded transition ${
            showConcrete ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
          title={showConcrete ? '隐藏混凝土' : '显示混凝土'}
        >
          <Box size={13} />
        </button>
        <span className="text-xs text-slate-300 font-medium flex-1">混凝土透明度</span>
        <span className="text-xs font-mono tabular-nums text-sky-400 w-10 text-right">{(opacity * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.01}
        value={opacity}
        onChange={(e) => set({ concreteOpacity: parseFloat(e.target.value) })}
        className="w-full accent-sky-500"
      />
      <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
        <button onClick={() => set({ concreteOpacity: 0 })} className="hover:text-sky-400">透视</button>
        <button onClick={() => set({ concreteOpacity: 0.15 })} className="hover:text-sky-400">微透</button>
        <button onClick={() => set({ concreteOpacity: 0.5 })} className="hover:text-sky-400">半透</button>
        <button onClick={() => set({ concreteOpacity: 1 })} className="hover:text-sky-400">实体</button>
      </div>
    </div>
  );
}
