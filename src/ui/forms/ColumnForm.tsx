import { useModelStore } from '@/store/modelStore';
import { CONCRETE_GRADES, ENV_CLASSES, NumberField, TextField, SelectField } from './common';

export default function ColumnForm() {
  const c = useModelStore((s) => s.column);
  const patch = useModelStore((s) => s.patchColumn);
  return (
    <div className="space-y-3">
      <div className="label">柱 (KZ) 参数</div>
      <TextField label="平法标注" mono value={c.pingfa}
        onChange={(v) => patch({ pingfa: v })}
        placeholder='KZ1 500x500 12C22 C8@100/200' />
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="层高 H" unit="mm" value={c.height} step={100} onChange={(v) => patch({ height: v })} />
        <NumberField label="截面 b" unit="mm" value={c.width} step={50} onChange={(v) => patch({ width: v })} />
        <NumberField label="截面 h" unit="mm" value={c.depth} step={50} onChange={(v) => patch({ depth: v })} />
        <SelectField label="混凝土等级" value={c.concreteGrade} options={CONCRETE_GRADES}
          onChange={(v) => patch({ concreteGrade: v })} />
        <SelectField label="环境类别" value={c.envClass} options={ENV_CLASSES}
          onChange={(v) => patch({ envClass: v })} />
      </div>
    </div>
  );
}
