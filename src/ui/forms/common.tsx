import type { ConcreteGrade, EnvClass } from '@/store/modelStore';

export const CONCRETE_GRADES: ConcreteGrade[] = ['C25', 'C30', 'C35', 'C40', 'C45', 'C50'];
export const ENV_CLASSES: EnvClass[] = ['I', 'IIa', 'IIb', 'IIIa', 'IIIb'];

export function Section({ title, children }: { title: string; children: any }) {
  return (
    <section>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">{title}</div>
      {children}
    </section>
  );
}

export function NumberField({
  label, value, onChange, min, max, step = 1, unit,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] text-slate-400 block mb-0.5">{label}{unit ? <span className="text-slate-600 ml-1">{unit}</span> : null}</span>
      <input type="number" className="input" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
    </label>
  );
}

export function TextField({
  label, value, onChange, placeholder, mono,
}: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block">
      {label && <span className="text-[11px] text-slate-400 block mb-0.5">{label}</span>}
      <input type="text" className={`input ${mono ? 'font-mono' : ''}`} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function SelectField<T extends string>({
  label, value, onChange, options,
}: { label: string; value: T; onChange: (v: T) => void; options: T[] }) {
  return (
    <label className="block">
      <span className="text-[11px] text-slate-400 block mb-0.5">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
