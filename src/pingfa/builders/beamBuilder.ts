import type { Rebar, Vec3 } from '@/three/rebar/types';
import { parseBeamPingfa } from '@/pingfa/parser';
import { minCover } from '@/pingfa/rules/cover';
import { beamSupportAnchorLen } from '@/pingfa/rules/anchorage';
import { stirrupHookLen } from '@/pingfa/rules/hook';
import { beamStirrupZoneLen } from '@/pingfa/rules/stirrupZone';
import type { BeamParams } from '@/store/modelStore';

export interface BeamBuilt {
  rebars: Rebar[];
  /** 混凝土包围盒（mm，构件局部坐标，原点在梁底跨中线） */
  concrete: { width: number; height: number; length: number };
  meta: { cover: number; pf: ReturnType<typeof parseBeamPingfa> };
}

/**
 * 构件局部坐标：
 *   X = 跨方向 (-L/2 .. +L/2)
 *   Y = 高度方向 (0 = 梁底, h = 梁顶)
 *   Z = 宽度方向 (-b/2 .. +b/2)
 */
export function buildBeam(p: BeamParams): BeamBuilt {
  const pf = parseBeamPingfa(p.pingfa);
  const b = pf.width ?? p.width;
  const h = pf.height ?? p.height;
  const L = p.span;
  const cover = minCover(p.envClass, 'beam', p.concreteGrade);

  const rebars: Rebar[] = [];

  // —— 主筋 ——
  // 集中：上部 / 下部 各排，z 方向均布
  const topRows = pf.topMain?.rows ?? [];
  const botRows = pf.bottomMain?.rows ?? [];

  function emitMain(rows: { count: number; diameter: number; grade: 'HPB300' | 'HRB400' | 'HRB500' }[][], side: 'top' | 'bottom') {
    rows.forEach((row, rowIndex) => {
      // 该排总根数
      const totalCount = row.reduce((s, r) => s + r.count, 0);
      if (totalCount === 0) return;
      const maxD = Math.max(...row.map((r) => r.diameter));
      // y 坐标：保护层 + 箍筋直径 + maxD/2 + rowIndex * (maxD + 25)（净距 25mm）
      const stirD = pf.stirrup?.diameter ?? 8;
      const yEdge = cover + stirD + maxD / 2 + rowIndex * (maxD + 25);
      const y = side === 'bottom' ? yEdge : h - yEdge;
      // z 均布：去掉两侧保护层 + 箍筋 + maxD/2
      const zMargin = cover + stirD + maxD / 2;
      const usable = b - 2 * zMargin;
      const step = totalCount > 1 ? usable / (totalCount - 1) : 0;
      let idx = 0;
      for (const spec of row) {
        const { straight, bendDown } = beamSupportAnchorLen(spec.grade, p.concreteGrade, spec.diameter, p.supportWidth);
        for (let i = 0; i < spec.count; i++, idx++) {
          const z = -b / 2 + zMargin + idx * step;
          // 折线：左端弯锚 -> 直段 -> 右端弯锚
          const x0 = -L / 2 - p.supportWidth / 2 + cover + 30;        // 左端起点（深入支座）
          const x1 = L / 2 + p.supportWidth / 2 - cover - 30;          // 右端终点
          let polyline: Vec3[];
          if (bendDown > 0) {
            // 左端 90°向下弯，下伸 bendDown；上层向下、下层向上
            const bendDir = side === 'top' ? -1 : 1;
            polyline = [
              [x0, y + bendDir * bendDown, z],
              [x0, y, z],
              [x1, y, z],
              [x1, y + bendDir * bendDown, z],
            ];
          } else {
            polyline = [
              [x0, y, z],
              [x1, y, z],
            ];
          }
          rebars.push({
            id: `${side}-${rowIndex}-${idx}`,
            diameter: spec.diameter,
            grade: spec.grade,
            polyline,
            role: side === 'top' ? 'topMain' : 'bottomMain',
          });
          // straight 已用于估算，可未来扩展
          void straight;
        }
      }
    });
  }
  emitMain(topRows, 'top');
  emitMain(botRows, 'bottom');

  // —— 箍筋 ——
  if (pf.stirrup) {
    const st = pf.stirrup;
    const hookLen = stirrupHookLen(st.diameter);
    const denseZone = beamStirrupZoneLen(h);
    // 一根箍筋的折线（在 x=0 处定义，再用 instances 沿 X 复制）
    // 矩形：z ∈ [-b/2+cover+st.d/2, b/2-cover-st.d/2], y ∈ [cover+st.d/2, h-cover-st.d/2]
    const z0 = -b / 2 + cover + st.diameter / 2;
    const z1 = b / 2 - cover - st.diameter / 2;
    const y0 = cover + st.diameter / 2;
    const y1 = h - cover - st.diameter / 2;
    // 135° 弯钩平直段沿 z 轴向内、向下倾入混凝土（这里简化为 z 向偏 hookLen，与 y 向 hookLen 的45°斜向内）
    const hk = hookLen / Math.SQRT2;
    const polyline: Vec3[] = [
      // 起钩：从内角斜向外
      [0, y0 + hk, z0 + hk],
      [0, y0, z0],
      [0, y1, z0],
      [0, y1, z1],
      [0, y0, z1],
      [0, y0, z0],   // 闭合返回起点
      [0, y0 + hk, z0 + hk], // 收钩
    ];
    // 沿 x 方向布置实例
    const offsets: { offset: Vec3 }[] = [];
    const halfL = L / 2;
    // 加密区在两端 [-halfL, -halfL+denseZone] 与 [halfL-denseZone, halfL]
    const list: number[] = [];
    let x = -halfL + 50; // 距支座边 50mm 起步
    while (x <= -halfL + denseZone) { list.push(x); x += st.spacingDense; }
    // 非加密
    const lastDenseEnd = list[list.length - 1] ?? -halfL + 50;
    x = lastDenseEnd + st.spacingNormal;
    const rightDenseStart = halfL - denseZone;
    while (x < rightDenseStart) { list.push(x); x += st.spacingNormal; }
    // 右端加密
    x = Math.max(x, rightDenseStart);
    while (x <= halfL - 50) { list.push(x); x += st.spacingDense; }
    for (const xi of list) offsets.push({ offset: [xi, 0, 0] });

    rebars.push({
      id: 'stirrup',
      diameter: st.diameter,
      grade: st.grade,
      polyline,
      role: 'stirrup',
      instances: offsets,
    });

    // 多肢箍：legs >= 4 时增加一组内箍（沿 z 方向居中）
    if (st.legs >= 4) {
      const zm = (z0 + z1) / 2;
      const inner: Vec3[] = [
        [0, y0 + hk, zm - 30 + hk],
        [0, y0, zm - 30],
        [0, y1, zm - 30],
        [0, y1, zm + 30],
        [0, y0, zm + 30],
        [0, y0, zm - 30],
        [0, y0 + hk, zm - 30 + hk],
      ];
      rebars.push({
        id: 'stirrup-inner',
        diameter: st.diameter,
        grade: st.grade,
        polyline: inner,
        role: 'stirrup',
        instances: offsets,
      });
    }
  }

  return {
    rebars,
    concrete: { width: b, height: h, length: L },
    meta: { cover, pf },
  };
}
