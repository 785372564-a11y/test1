import { useModelStore } from '@/store/modelStore';
import { CONCRETE_GRADES, ENV_CLASSES, NumberField, TextField, SelectField } from './common';

export default function WallForm() {
  const w = useModelStore((s) => s.wall);
  const patch = useModelStore((s) => s.patchWall);
  return (
    <div className="space-y-3">
      <div className="label">剪力墙参数</div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="长度" unit="mm" value={w.length} step={100} onChange={(v) => patch({ length: v })} />
        <NumberField label="高度" unit="mm" value={w.height} step={100} onChange={(v) => patch({ height: v })} />
        <NumberField label="厚度" unit="mm" value={w.thickness} step={10} onChange={(v) => patch({ thickness: v })} />
      </div>
      <TextField label="水平筋" mono value={w.horizontalBar} onChange={(v) => patch({ horizontalBar: v })} />
      <TextField label="竖向筋" mono value={w.verticalBar} onChange={(v) => patch({ verticalBar: v })} />
      <div className="grid grid-cols-3 gap-2">
        <SelectField label="排数" value={String(w.layers) as '1' | '2'} options={['1', '2']}
          onChange={(v) => patch({ layers: parseInt(v, 10) as 1 | 2 })} />
        <SelectField label="混凝土" value={w.concreteGrade} options={CONCRETE_GRADES}
          onChange={(v) => patch({ concreteGrade: v })} />
        <SelectField label="环境" value={w.envClass} options={ENV_CLASSES}
          onChange={(v) => patch({ envClass: v })} />
      </div>
    </div>
  );
}
