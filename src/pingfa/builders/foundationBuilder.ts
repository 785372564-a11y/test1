import type { Rebar } from '@/three/rebar/types';
import { parseUniformBar } from '@/pingfa/parser';
import { minCover } from '@/pingfa/rules/cover';
import type { FoundationParams } from '@/store/modelStore';

export interface FoundationBuilt {
  rebars: Rebar[];
  concrete: { lengthX: number; lengthY: number; thickness: number };
}

/** 独立基础（双向底筋）。原点 = 基础底面中心。 */
export function buildFoundation(p: FoundationParams): FoundationBuilt {
  const Lx = p.lengthX, Ly = p.lengthY, t = p.thickness;
  const cover = minCover(p.envClass, 'plate', p.concreteGrade);
  const rebars: Rebar[] = [];

  const x = parseUniformBar(p.bottomBarX);
  const yBar = parseUniformBar(p.bottomBarY);

  if (x) {
    // 沿 X 的钢筋（位于较内层）
    const y = cover + x.diameter / 2 + (yBar?.diameter ?? 0);
    const zStart = -Ly / 2 + cover + x.diameter / 2;
    const zEnd = Ly / 2 - cover - x.diameter / 2;
    const n = Math.max(1, Math.floor((zEnd - zStart) / x.spacing) + 1);
    for (let i = 0; i < n; i++) {
      const z = zStart + i * x.spacing;
      rebars.push({
        id: `fb-x-${i}`,
        diameter: x.diameter, grade: x.grade,
        polyline: [[-Lx / 2 + cover, y, z], [Lx / 2 - cover, y, z]],
        role: 'foundationBottom',
      });
    }
  }
  if (yBar) {
    // 沿 Y(=z 方向) 的钢筋（外层贴底）
    const y = cover + yBar.diameter / 2;
    const xStart = -Lx / 2 + cover + yBar.diameter / 2;
    const xEnd = Lx / 2 - cover - yBar.diameter / 2;
    const n = Math.max(1, Math.floor((xEnd - xStart) / yBar.spacing) + 1);
    for (let i = 0; i < n; i++) {
      const xi = xStart + i * yBar.spacing;
      rebars.push({
        id: `fb-z-${i}`,
        diameter: yBar.diameter, grade: yBar.grade,
        polyline: [[xi, y, -Ly / 2 + cover], [xi, y, Ly / 2 - cover]],
        role: 'foundationBottom',
      });
    }
  }
  return { rebars, concrete: { lengthX: Lx, lengthY: Ly, thickness: t } };
}
