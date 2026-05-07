import type { Rebar, Vec3 } from '@/three/rebar/types';
import { parseColumnPingfa } from '@/pingfa/parser';
import { minCover } from '@/pingfa/rules/cover';
import { stirrupHookLen } from '@/pingfa/rules/hook';
import { columnStirrupZoneLen } from '@/pingfa/rules/stirrupZone';
import type { ColumnParams } from '@/store/modelStore';

export interface ColumnBuilt {
  rebars: Rebar[];
  concrete: { width: number; depth: number; height: number };
}

/**
 * 局部坐标：原点 = 柱底中心
 *   X = 截面宽（bc，沿 width）
 *   Y = 高度（0..H）
 *   Z = 截面深（hc，沿 depth）
 */
export function buildColumn(p: ColumnParams): ColumnBuilt {
  const pf = parseColumnPingfa(p.pingfa);
  const bc = pf.width ?? p.width;
  const hc = pf.depth ?? p.depth;
  const H = p.height;
  const cover = minCover(p.envClass, 'beam', p.concreteGrade);

  const rebars: Rebar[] = [];
  const stir = pf.stirrup;
  const stirD = stir?.diameter ?? 8;

  // —— 纵筋：沿截面周边均布 ——
  if (pf.longitudinal) {
    const { total, diameter, grade } = pf.longitudinal;
    // 周长四边按比例分配根数（角部各 1）
    const inset = cover + stirD + diameter / 2;
    const x0 = -bc / 2 + inset, x1 = bc / 2 - inset;
    const z0 = -hc / 2 + inset, z1 = hc / 2 - inset;
    const corners: Vec3[] = [
      [x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1],
    ];
    // 边上中间根数：(total - 4) 按 X 边/Z 边比例分
    const remain = Math.max(0, total - 4);
    const ratioX = bc / (bc + hc);
    const onX = Math.round(remain * ratioX / 2) * 2; // 上下两边各 onX/2
    const onZ = remain - onX;
    const positions: Vec3[] = [...corners];
    function distribute(p1: Vec3, p2: Vec3, n: number) {
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 1);
        positions.push([
          p1[0] + (p2[0] - p1[0]) * t,
          0,
          p1[2] + (p2[2] - p1[2]) * t,
        ]);
      }
    }
    distribute(corners[0], corners[1], onX / 2);
    distribute(corners[3], corners[2], onX / 2);
    distribute(corners[0], corners[3], onZ / 2);
    distribute(corners[1], corners[2], onZ / 2);
    positions.forEach((pos, idx) => {
      rebars.push({
        id: `long-${idx}`,
        diameter, grade,
        polyline: [
          [pos[0], -100, pos[2]],         // 伸入下层 100mm（示意，实际由楼层接续）
          [pos[0], H + 100, pos[2]],      // 伸入上层
        ],
        role: 'longitudinal',
      });
    });
  }

  // —— 箍筋（外箍 + 简化双向拉钩） ——
  if (stir) {
    const hookLen = stirrupHookLen(stir.diameter);
    const hk = hookLen / Math.SQRT2;
    const x0 = -bc / 2 + cover + stir.diameter / 2;
    const x1 = bc / 2 - cover - stir.diameter / 2;
    const z0 = -hc / 2 + cover + stir.diameter / 2;
    const z1 = hc / 2 - cover - stir.diameter / 2;
    // 单根箍筋折线（在 y=0 处定义）
    const polyline: Vec3[] = [
      [x0 + hk, 0, z0 + hk],
      [x0, 0, z0],
      [x1, 0, z0],
      [x1, 0, z1],
      [x0, 0, z1],
      [x0, 0, z0],
      [x0 + hk, 0, z0 + hk],
    ];
    // 沿 Y 分布：底/顶加密 + 中间非加密
    const denseZone = columnStirrupZoneLen(H, Math.max(bc, hc));
    const offsets: { offset: Vec3 }[] = [];
    const list: number[] = [];
    let y = 50;
    while (y <= denseZone) { list.push(y); y += stir.spacingDense; }
    const lastDense = list[list.length - 1] ?? 50;
    y = lastDense + stir.spacingNormal;
    while (y < H - denseZone) { list.push(y); y += stir.spacingNormal; }
    y = Math.max(y, H - denseZone);
    while (y <= H - 50) { list.push(y); y += stir.spacingDense; }
    for (const yi of list) offsets.push({ offset: [0, yi, 0] });

    rebars.push({
      id: 'col-stirrup',
      diameter: stir.diameter,
      grade: stir.grade,
      polyline,
      role: 'stirrup',
      instances: offsets,
    });
  }

  return {
    rebars,
    concrete: { width: bc, depth: hc, height: H },
  };
}
