export type Vec3 = [number, number, number];

export type RebarGrade = 'HPB300' | 'HRB400' | 'HRB500';

export type RebarRole =
  | 'topMain'      // 上部受力筋
  | 'bottomMain'   // 下部受力筋
  | 'sideStruct'   // 侧面构造筋 G
  | 'sideTorsion'  // 侧面抗扭筋 N
  | 'erection'     // 架立筋
  | 'stirrup'      // 箍筋
  | 'longitudinal' // 柱纵筋
  | 'slabTop'
  | 'slabBottom'
  | 'wallVertical'
  | 'wallHorizontal'
  | 'foundationBottom';

export interface Rebar {
  id: string;
  diameter: number; // mm
  grade: RebarGrade;
  /** 中心线折点（mm，世界坐标，单位与构件一致） */
  polyline: Vec3[];
  /** 折点处倒角半径（mm）；默认 = 5d（HRB400/500）或 2.5d（HPB300） */
  bendRadius?: number;
  role: RebarRole;
  /** 对于完全相同的箍筋形状，给出实例阵列以便用 InstancedMesh 合批 */
  instances?: { offset: Vec3 }[];
  closed?: boolean; // 闭合（不用于本项目，箍筋以折线表达含弯钩）
}
