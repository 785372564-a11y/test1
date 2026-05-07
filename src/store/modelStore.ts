import { create } from 'zustand';

export type ComponentKind = 'beam' | 'column' | 'slab' | 'wall' | 'foundation';
export type ConcreteGrade = 'C25' | 'C30' | 'C35' | 'C40' | 'C45' | 'C50';
export type EnvClass = 'I' | 'IIa' | 'IIb' | 'IIIa' | 'IIIb';

export interface BeamParams {
  // 几何
  span: number;          // 净跨 mm
  width: number;         // b mm
  height: number;        // h mm
  // 平法配筋字符串（集中标注简化版）
  pingfa: string;        // 例: "KL1(1) 300x600 C8@100/200(2) 2C25;4C25"
  // 计算参数
  concreteGrade: ConcreteGrade;
  envClass: EnvClass;
  supportWidth: number;  // 支座宽度（柱宽）mm，影响锚固
}

export interface ColumnParams {
  height: number;        // mm 楼层净高
  width: number;         // bc mm
  depth: number;         // hc mm
  pingfa: string;        // 例: "KZ1 500x500 12C22 C8@100/200"
  concreteGrade: ConcreteGrade;
  envClass: EnvClass;
}

export interface SlabParams {
  lengthX: number; lengthY: number; thickness: number;
  topBarX: string;   // 例: "C10@150"
  topBarY: string;
  bottomBarX: string;
  bottomBarY: string;
  concreteGrade: ConcreteGrade;
  envClass: EnvClass;
}

export interface WallParams {
  length: number; height: number; thickness: number;
  horizontalBar: string; // "C10@200"
  verticalBar: string;
  layers: 1 | 2;
  concreteGrade: ConcreteGrade;
  envClass: EnvClass;
}

export interface FoundationParams {
  lengthX: number; lengthY: number; thickness: number;
  bottomBarX: string;
  bottomBarY: string;
  concreteGrade: ConcreteGrade;
  envClass: EnvClass;
}

interface ModelState {
  kind: ComponentKind;
  beam: BeamParams;
  column: ColumnParams;
  slab: SlabParams;
  wall: WallParams;
  foundation: FoundationParams;
  setKind: (k: ComponentKind) => void;
  patchBeam: (p: Partial<BeamParams>) => void;
  patchColumn: (p: Partial<ColumnParams>) => void;
  patchSlab: (p: Partial<SlabParams>) => void;
  patchWall: (p: Partial<WallParams>) => void;
  patchFoundation: (p: Partial<FoundationParams>) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  kind: 'beam',
  beam: {
    span: 6000,
    width: 300,
    height: 600,
    pingfa: 'KL1(1) 300x600 C8@100/200(2) 2C25;4C25',
    concreteGrade: 'C30',
    envClass: 'I',
    supportWidth: 500,
  },
  column: {
    height: 3600,
    width: 500,
    depth: 500,
    pingfa: 'KZ1 500x500 12C22 C8@100/200',
    concreteGrade: 'C30',
    envClass: 'I',
  },
  slab: {
    lengthX: 4000, lengthY: 3000, thickness: 120,
    topBarX: 'C10@150', topBarY: 'C10@150',
    bottomBarX: 'C10@150', bottomBarY: 'C10@150',
    concreteGrade: 'C30', envClass: 'I',
  },
  wall: {
    length: 4000, height: 3000, thickness: 200,
    horizontalBar: 'C10@200', verticalBar: 'C12@200',
    layers: 2,
    concreteGrade: 'C30', envClass: 'I',
  },
  foundation: {
    lengthX: 3000, lengthY: 3000, thickness: 500,
    bottomBarX: 'C16@150', bottomBarY: 'C16@150',
    concreteGrade: 'C30', envClass: 'IIa',
  },
  setKind: (k) => set({ kind: k }),
  patchBeam: (p) => set((s) => ({ beam: { ...s.beam, ...p } })),
  patchColumn: (p) => set((s) => ({ column: { ...s.column, ...p } })),
  patchSlab: (p) => set((s) => ({ slab: { ...s.slab, ...p } })),
  patchWall: (p) => set((s) => ({ wall: { ...s.wall, ...p } })),
  patchFoundation: (p) => set((s) => ({ foundation: { ...s.foundation, ...p } })),
}));
