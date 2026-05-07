import * as THREE from 'three';
import type { Vec3 } from './types';

interface Seg {
  kind: 'line' | 'arc';
  length: number;
  cum: number; // 累计长度起点
  // line
  a?: THREE.Vector3;
  b?: THREE.Vector3;
  // arc
  center?: THREE.Vector3;
  u?: THREE.Vector3; // 起点方向单位向量（在弧平面内）
  v?: THREE.Vector3; // 与 u 正交，朝向圆弧扫掠方向
  radius?: number;
  angle?: number;
}

/**
 * 由折线 + 折点倒角半径生成一条平滑曲线（直线段 + 圆弧倒角段）。
 * 用 THREE.Curve 子类暴露给 TubeGeometry。
 */
export class FilletedPolylineCurve3 extends THREE.Curve<THREE.Vector3> {
  private segs: Seg[] = [];
  private total = 0;

  constructor(points: Vec3[], bendRadius: number) {
    super();
    if (points.length < 2) {
      this.segs = [];
      this.total = 0;
      return;
    }
    const pts = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const tangentPts: THREE.Vector3[] = [pts[0].clone()];
    type Arc = { center: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3; radius: number; angle: number };
    const arcs: (Arc | null)[] = [];
    for (let i = 1; i < pts.length - 1; i++) {
      const A = pts[i - 1];
      const P = pts[i];
      const B = pts[i + 1];
      const dirIn = new THREE.Vector3().subVectors(P, A);
      const dirOut = new THREE.Vector3().subVectors(B, P);
      const lenIn = dirIn.length();
      const lenOut = dirOut.length();
      dirIn.normalize();
      dirOut.normalize();
      const dot = THREE.MathUtils.clamp(dirIn.dot(dirOut), -1, 1);
      const turn = Math.acos(dot); // 0=直线,π=反向
      if (turn < 1e-3 || bendRadius <= 0) {
        tangentPts.push(P.clone());
        arcs.push(null);
        continue;
      }
      // 切线长 d = R / tan((π-turn)/2) = R * tan(turn/2)
      // 注意：turn 是方向偏转角；圆弧圆心角 = turn
      const tangentLen = bendRadius / Math.tan((Math.PI - turn) / 2);
      // 不能超过两边一半
      const maxT = Math.min(lenIn / 2, lenOut / 2) * 0.95;
      const d = Math.min(tangentLen, maxT);
      const effRadius = d * Math.tan((Math.PI - turn) / 2);
      const T1 = new THREE.Vector3().copy(P).addScaledVector(dirIn, -d);
      const T2 = new THREE.Vector3().copy(P).addScaledVector(dirOut, d);
      // 圆弧平面法线
      const normal = new THREE.Vector3().crossVectors(dirIn, dirOut).normalize();
      // 从 T1 指向圆心的向量：垂直 dirIn，并朝向"内侧"
      const toCenterFromT1 = new THREE.Vector3().crossVectors(dirIn, normal).normalize().multiplyScalar(-1);
      // 验证方向（需要使 center 离 dirOut 的延长侧也距离 = R）
      const center = new THREE.Vector3().copy(T1).addScaledVector(toCenterFromT1, effRadius);
      const u = new THREE.Vector3().subVectors(T1, center).normalize();
      // v 在弧平面内，垂直 u，朝扫掠方向
      const v = new THREE.Vector3().crossVectors(normal, u).normalize();
      // 检查 v 与 dirOut 的同向性
      if (v.dot(dirOut) < 0) v.negate();
      tangentPts.push(T1);
      tangentPts.push(T2);
      arcs.push({ center, u, v, radius: effRadius, angle: turn });
    }
    tangentPts.push(pts[pts.length - 1].clone());

    // 生成 segs：line(t0->t1) [arc] line(t2->t3) [arc] ...
    // tangentPts 的索引：i=0 起点, 末尾 = 终点
    // 中间每个原始内部折点 i 贡献两个切点（如果有弧）：tangentPts 索引为 1+2k 与 2+2k
    const segs: Seg[] = [];
    let cum = 0;
    let idx = 0;
    // 直线段：tangentPts[idx] -> tangentPts[idx+1]
    while (idx < tangentPts.length - 1) {
      const a = tangentPts[idx];
      const b = tangentPts[idx + 1];
      const len = a.distanceTo(b);
      if (len > 1e-6) {
        segs.push({ kind: 'line', length: len, cum, a: a.clone(), b: b.clone() });
        cum += len;
      }
      idx++;
      // 检查是否在此切点对之间存在弧：tangentPts[1..2k] 之后为弧
      // 弧位置：在原始内部折点 i，对应 tangentPts 的 (2*i-1, 2*i)
      // 简化：如果当前 idx 偶数（>=2）并且对应 arcs 有值，则插入弧。
      // 因为构造方式：每有弧的内部点贡献2个 tangentPts，无弧贡献1个 → 复杂。
      // 改用同步指针下方的循环：见下方重写。
      break;
    }
    // —— 改写：用同步指针构造 ——
    segs.length = 0;
    cum = 0;
    let tIdx = 0; // tangentPts 指针
    // 起点 = tangentPts[0]
    for (let i = 1; i <= pts.length - 1; i++) {
      // 段终点 tangent：
      const isInner = i < pts.length - 1;
      const arc = isInner ? arcs[i - 1] : null;
      // 直线段终点：若内部点有弧 → tangentPts[tIdx+1]（=T1），否则 = tangentPts[tIdx+1] = 原始点
      const a = tangentPts[tIdx];
      const b = tangentPts[tIdx + 1];
      const len = a.distanceTo(b);
      if (len > 1e-6) {
        segs.push({ kind: 'line', length: len, cum, a: a.clone(), b: b.clone() });
        cum += len;
      }
      tIdx += 1;
      if (arc) {
        const arcLen = arc.radius * arc.angle;
        if (arcLen > 1e-6) {
          segs.push({
            kind: 'arc', length: arcLen, cum,
            center: arc.center.clone(), u: arc.u.clone(), v: arc.v.clone(),
            radius: arc.radius, angle: arc.angle,
          });
          cum += arcLen;
        }
        tIdx += 1; // 跳过 T2 作为下一直线段起点
      }
    }
    this.segs = segs;
    this.total = cum;
  }

  getLength(): number { return this.total; }

  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    if (this.total <= 0 || this.segs.length === 0) return target.set(0, 0, 0);
    const s = THREE.MathUtils.clamp(t, 0, 1) * this.total;
    // 二分定位
    let lo = 0, hi = this.segs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.segs[mid].cum <= s) lo = mid; else hi = mid - 1;
    }
    const seg = this.segs[lo];
    const local = s - seg.cum;
    if (seg.kind === 'line') {
      const k = seg.length > 0 ? local / seg.length : 0;
      return target.copy(seg.a!).lerp(seg.b!, k);
    } else {
      const θ = seg.length > 0 ? (local / seg.length) * seg.angle! : 0;
      const cos = Math.cos(θ);
      const sin = Math.sin(θ);
      target.copy(seg.center!)
        .addScaledVector(seg.u!, cos * seg.radius!)
        .addScaledVector(seg.v!, sin * seg.radius!);
      return target;
    }
  }
}

/** 默认弯弧半径：HPB300 取 1.25d（弯钩内径 D=2.5d，半径=D/2），其余 2d (D=4d) */
export function defaultBendRadius(diameter: number, grade: 'HPB300' | 'HRB400' | 'HRB500'): number {
  if (grade === 'HPB300') return diameter * 1.25;
  return diameter * 2;
}
