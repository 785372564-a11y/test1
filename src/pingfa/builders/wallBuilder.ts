import type { Rebar, Vec3 } from '@/three/rebar/types';
import { parseUniformBar } from '@/pingfa/parser';
import { minCover } from '@/pingfa/rules/cover';
import type { WallParams } from '@/store/modelStore';

export interface WallBuilt {
  rebars: Rebar[];
  concrete: { length: number; height: number; thickness: number };
}

/** 局部坐标：原点 = 墙底中心，X 长度方向，Y 高度方向，Z 厚度方向 */
export function buildWall(p: WallParams): WallBuilt {
  const L = p.length, H = p.height, T = p.thickness;
  const cover = minCover(p.envClass, 'plate', p.concreteGrade);
  const rebars: Rebar[] = [];

  const layers = p.layers;
  const layerZs: number[] = layers === 1
    ? [0]
    : [-T / 2 + cover, T / 2 - cover];

  const horiz = parseUniformBar(p.horizontalBar);
  const vert = parseUniformBar(p.verticalBar);

  layerZs.forEach((z, li) => {
    if (horiz) {
      const yStart = cover + horiz.diameter / 2;
      const yEnd = H - cover - horiz.diameter / 2;
      const n = Math.max(1, Math.floor((yEnd - yStart) / horiz.spacing) + 1);
      for (let i = 0; i < n; i++) {
        const y = yStart + i * horiz.spacing;
        rebars.push({
          id: `wh-${li}-${i}`,
          diameter: horiz.diameter, grade: horiz.grade,
          polyline: [[-L / 2 + cover, y, z], [L / 2 - cover, y, z]],
          role: 'wallHorizontal',
        });
      }
    }
    if (vert) {
      const xStart = -L / 2 + cover + vert.diameter / 2;
      const xEnd = L / 2 - cover - vert.diameter / 2;
      const n = Math.max(1, Math.floor((xEnd - xStart) / vert.spacing) + 1);
      for (let i = 0; i < n; i++) {
        const x = xStart + i * vert.spacing;
        rebars.push({
          id: `wv-${li}-${i}`,
          diameter: vert.diameter, grade: vert.grade,
          polyline: [[x, cover, z], [x, H - cover, z]],
          role: 'wallVertical',
        });
      }
    }
  });

  return { rebars, concrete: { length: L, height: H, thickness: T } };
}
