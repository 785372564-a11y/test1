import { useModelStore } from '@/store/modelStore';
import { CONCRETE_GRADES, ENV_CLASSES, NumberField, TextField, SelectField, Section } from './common';

export default function BeamForm() {
  const beam = useModelStore((s) => s.beam);
  const patch = useModelStore((s) => s.patchBeam);
  return (
    <div className="space-y-4">
      <Section title="平法标注">
        <TextField mono value={beam.pingfa}
          onChange={(v) => patch({ pingfa: v })}
          placeholder='KL1(1) 300x600 C8@100/200(2) 2C25;4C25' />
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
          例 <span className="text-sky-400 font-mono">2C25;4C25</span> 上下分置 ·
          <span className="text-sky-400 font-mono"> 4C25 2/2</span> 分排 ·
          <span className="text-sky-400 font-mono"> 2C25+2C22</span> 混合
        </p>
      </Section>

      <Section title="几何">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="跨度 L" unit="mm" value={beam.span} step={100} onChange={(v) => patch({ span: v })} />
          <NumberField label="支座宽" unit="mm" value={beam.supportWidth} step={50} onChange={(v) => patch({ supportWidth: v })} />
          <NumberField label="梁宽 b" unit="mm" value={beam.width} step={50} onChange={(v) => patch({ width: v })} />
          <NumberField label="梁高 h" unit="mm" value={beam.height} step={50} onChange={(v) => patch({ height: v })} />
        </div>
      </Section>

      <Section title="材料">
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="混凝土" value={beam.concreteGrade} options={CONCRETE_GRADES}
            onChange={(v) => patch({ concreteGrade: v })} />
          <SelectField label="环境类别" value={beam.envClass} options={ENV_CLASSES}
            onChange={(v) => patch({ envClass: v })} />
        </div>
      </Section>
    </div>
  );
}
