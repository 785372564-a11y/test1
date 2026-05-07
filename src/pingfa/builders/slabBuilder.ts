import type { Rebar, Vec3 } from '@/three/rebar/types';
import { parseUniformBar } from '@/pingfa/parser';
import { minCover } from '@/pingfa/rules/cover';
import type { SlabParams } from '@/store/modelStore';

export interface SlabBuilt {
  rebars: Rebar[];
  concrete: { lengthX: number; lengthY: number; thickness: number };
}

/**
 * 局部坐标：原点 = 板底中心
 *   X ∈ [-Lx/2, Lx/2], Y ∈ [0, t], Z ∈ [-Ly/2, Ly/2]
 */
export function buildSlab(p: SlabParams): SlabBuilt {
  const Lx = p.lengthX, Ly = p.lengthY, t = p.thickness;
  const cover = minCover(p.envClass, 'plate', p.concreteGrade);
  const rebars: Rebar[] = [];

  function emit(s: string, layer: 'top' | 'bottom', dir: 'x' | 'z', innerOffsetD: number) {
    const sp = parseUniformBar(s);
    if (!sp) return;
    const y = layer === 'bottom'
      ? cover + sp.diameter / 2 + innerOffsetD
      : t - cover - sp.diameter / 2 - innerOffsetD;
    if (dir === 'x') {
      // 沿 X 方向布置（即钢筋方向 = X），根数沿 Z 排列
      const zStart = -Ly / 2 + cover + sp.diameter / 2;
      const zEnd = Ly / 2 - cover - sp.diameter / 2;
      const n = Math.max(1, Math.floor((zEnd - zStart) / sp.spacing) + 1);
      for (let i = 0; i < n; i++) {
        const z = zStart + i * sp.spacing;
        rebars.push({
          id: `${layer}-x-${i}`,
          diameter: sp.diameter, grade: sp.grade,
          polyline: [
            [-Lx / 2 + cover, y, z],
            [Lx / 2 - cover, y, z],
          ],
          role: layer === 'top' ? 'slabTop' : 'slabBottom',
        });
      }
    } else {
      const xStart = -Lx / 2 + cover + sp.diameter / 2;
      const xEnd = Lx / 2 - cover - sp.diameter / 2;
      const n = Math.max(1, Math.floor((xEnd - xStart) / sp.spacing) + 1);
      for (let i = 0; i < n; i++) {
        const x = xStart + i * sp.spacing;
        rebars.push({
          id: `${layer}-z-${i}`,
          diameter: sp.diameter, grade: sp.grade,
          polyline: [
            [x, y, -Ly / 2 + cover],
            [x, y, Ly / 2 - cover],
          ],
          role: layer === 'top' ? 'slabTop' : 'slabBottom',
        });
      }
    }
  }

  // 双层双向：底筋 X (内层) → 底筋 Z (外层贴底), 顶筋 X (外层贴顶) → 顶筋 Z (内层)
  emit(p.bottomBarX, 'bottom', 'x', 0);
  emit(p.bottomBarY, 'bottom', 'z', 12);
  emit(p.topBarX, 'top', 'x', 0);
  emit(p.topBarY, 'top', 'z', 12);

  return { rebars, concrete: { lengthX: Lx, lengthY: Ly, thickness: t } };
}
