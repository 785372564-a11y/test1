import { useViewStore } from '@/store/viewStore';
import { Box, Eye, EyeOff, Grid3x3, Sparkles, Spline, Circle } from 'lucide-react';

interface IconBtnProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: any;
}

function IconBtn({ active, onClick, title, children }: IconBtnProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-9 h-9 grid place-items-center rounded transition ${
        active ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

export default function ViewControls() {
  const v = useViewStore();
  return (
    <div className="absolute bottom-4 right-4 z-10 panel p-1.5 flex items-center gap-1">
      <IconBtn active={v.showConcrete} title="混凝土" onClick={() => v.set({ showConcrete: !v.showConcrete })}>
        <Box size={16} />
      </IconBtn>
      <IconBtn active={v.showLongitudinal} title="纵筋" onClick={() => v.set({ showLongitudinal: !v.showLongitudinal })}>
        <Spline size={16} />
      </IconBtn>
      <IconBtn active={v.showStirrups} title="箍筋" onClick={() => v.set({ showStirrups: !v.showStirrups })}>
        <Circle size={16} />
      </IconBtn>
      <IconBtn active={v.showRebar} title="钢筋总开关" onClick={() => v.set({ showRebar: !v.showRebar })}>
        {v.showRebar ? <Eye size={16} /> : <EyeOff size={16} />}
      </IconBtn>
      <div className="w-px h-6 bg-slate-700 mx-1" />
      <IconBtn active={v.showGrid} title="网格" onClick={() => v.set({ showGrid: !v.showGrid })}>
        <Grid3x3 size={16} />
      </IconBtn>
      <IconBtn active={v.postFx} title="后处理 (SSAO/Bloom)" onClick={() => v.set({ postFx: !v.postFx })}>
        <Sparkles size={16} />
      </IconBtn>
    </div>
  );
}
