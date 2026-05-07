import { useModelStore } from '@/store/modelStore';
import { CONCRETE_GRADES, ENV_CLASSES, NumberField, TextField, SelectField } from './common';

export default function FoundationForm() {
  const f = useModelStore((s) => s.foundation);
  const patch = useModelStore((s) => s.patchFoundation);
  return (
    <div className="space-y-3">
      <div className="label">独立基础参数</div>
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Lx" unit="mm" value={f.lengthX} step={100} onChange={(v) => patch({ lengthX: v })} />
        <NumberField label="Ly" unit="mm" value={f.lengthY} step={100} onChange={(v) => patch({ lengthY: v })} />
        <NumberField label="厚度" unit="mm" value={f.thickness} step={50} onChange={(v) => patch({ thickness: v })} />
      </div>
      <TextField label="底筋 X 向" mono value={f.bottomBarX} onChange={(v) => patch({ bottomBarX: v })} />
      <TextField label="底筋 Y 向" mono value={f.bottomBarY} onChange={(v) => patch({ bottomBarY: v })} />
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="混凝土" value={f.concreteGrade} options={CONCRETE_GRADES}
          onChange={(v) => patch({ concreteGrade: v })} />
        <SelectField label="环境" value={f.envClass} options={ENV_CLASSES}
          onChange={(v) => patch({ envClass: v })} />
      </div>
    </div>
  );
}
