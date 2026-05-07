import type { ConcreteGrade, EnvClass } from '@/store/modelStore';

/**
 * 22G101-1 表 8.2.1 最小保护层厚度（mm）—— 板/墙/壳 与 梁/柱/杆 两档。
 * 这里给出常用工程值（C25 +5mm，C30 及以上按表中值）。
 */
const TABLE: Record<EnvClass, { plate: number; beam: number }> = {
  I:    { plate: 15, beam: 20 },
  IIa:  { plate: 20, beam: 25 },
  IIb:  { plate: 25, beam: 35 },
  IIIa: { plate: 30, beam: 40 },
  IIIb: { plate: 40, beam: 50 },
};

export function minCover(env: EnvClass, kind: 'plate' | 'beam', grade: ConcreteGrade): number {
  const base = TABLE[env][kind];
  return grade === 'C25' ? base + 5 : base;
}
