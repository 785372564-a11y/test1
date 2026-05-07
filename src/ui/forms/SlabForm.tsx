import { useModelStore } from '@/store/modelStore';
import { CONCRETE_GRADES, ENV_CLASSES, NumberField, TextField, SelectField } from './common';

export default function SlabForm() {
  const s = useModelStore((x) => x.slab);
  const patch = useModelStore((x) => x.patchSlab);
  return (
    <div className="space-y-3">
      <div className="label">板参数</div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Lx" unit="mm" value={s.lengthX} step={100} onChange={(v) => patch({ lengthX: v })} />
        <NumberField label="Ly" unit="mm" value={s.lengthY} step={100} onChange={(v) => patch({ lengthY: v })} />
        <NumberField label="厚度" unit="mm" value={s.thickness} step={10} onChange={(v) => patch({ thickness: v })} />
      </div>
      <TextField label="底筋 X 向" mono value={s.bottomBarX} onChange={(v) => patch({ bottomBarX: v })} />
      <TextField label="底筋 Y 向" mono value={s.bottomBarY} onChange={(v) => patch({ bottomBarY: v })} />
      <TextField label="顶筋 X 向" mono value={s.topBarX} onChange={(v) => patch({ topBarX: v })} />
      <TextField label="顶筋 Y 向" mono value={s.topBarY} onChange={(v) => patch({ topBarY: v })} />
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="混凝土" value={s.concreteGrade} options={CONCRETE_GRADES}
          onChange={(v) => patch({ concreteGrade: v })} />
        <SelectField label="环境" value={s.envClass} options={ENV_CLASSES}
          onChange={(v) => patch({ envClass: v })} />
      </div>
    </div>
  );
}
