import type { ConcreteGrade } from '@/store/modelStore';
import type { RebarGrade } from '@/three/rebar/types';

/**
 * 22G101-1 表 受拉钢筋基本锚固长度 lab（非抗震）/ labE（抗震，按 1.15 倍简化），单位：d 的倍数
 * 真实表更细致；此处取常用值，覆盖 C25~C50。
 */
const LAB_TABLE: Record<RebarGrade, Partial<Record<ConcreteGrade, number>>> = {
  HPB300: { C25: 34, C30: 30, C35: 28, C40: 25, C45: 24, C50: 23 },
  HRB400: { C25: 40, C30: 35, C35: 32, C40: 29, C45: 28, C50: 27 },
  HRB500: { C25: 48, C30: 43, C35: 39, C40: 36, C45: 34, C50: 32 },
};

export function lab(grade: RebarGrade, concrete: ConcreteGrade, diameter: number): number {
  const k = LAB_TABLE[grade][concrete] ?? 35;
  return k * diameter;
}

export function labE(grade: RebarGrade, concrete: ConcreteGrade, diameter: number, seismic = true): number {
  const base = lab(grade, concrete, diameter);
  return seismic ? Math.round(base * 1.15) : base;
}

/** 框架梁端钢筋伸入支座的水平段长度（22G101-1 5.2.2） */
export function beamSupportAnchorLen(
  grade: RebarGrade, concrete: ConcreteGrade, diameter: number, supportWidth: number,
): { straight: number; bendDown: number } {
  const labe = labE(grade, concrete, diameter);
  // 直锚 ≥ labE 且 ≥ 0.5hc + 5d → 简化为 max(labE, 0.5*hc + 5d)
  // 不满足直锚则弯锚：水平段 ≥ 0.4*labE，弯钩 15d
  const half = 0.5 * supportWidth + 5 * diameter;
  const straightOk = supportWidth - 30 >= labe; // 30 为保护层估算
  if (straightOk) return { straight: Math.max(labe, half), bendDown: 0 };
  return { straight: Math.max(0.4 * labe, supportWidth - 30), bendDown: 15 * diameter };
}
