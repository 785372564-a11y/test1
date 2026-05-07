import { create } from 'zustand';

export type RenderMode = 'role' | 'realistic';

interface ViewState {
  showGrid: boolean;
  postFx: boolean;
  concreteOpacity: number;
  showConcrete: boolean;
  showRebar: boolean;
  showStirrups: boolean;
  showLongitudinal: boolean;
  renderMode: RenderMode;
  clipEnabled: boolean;
  clipAxis: 'x' | 'y' | 'z';
  clipPosition: number; // -1..1 normalized
  selectedRebarId: string | null;
  hoveredRebarId: string | null;
  isolateSelected: boolean;
  showDimensions: boolean;
  showRebarLabels: boolean;
  explode: number; // 0..1 钢筋向外爆炸
  set: (patch: Partial<ViewState>) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  showGrid: false,
  postFx: true,
  concreteOpacity: 0.45,
  showConcrete: true,
  showRebar: true,
  showStirrups: true,
  showLongitudinal: true,
  renderMode: 'role',
  clipEnabled: false,
  clipAxis: 'x',
  clipPosition: 0,
  selectedRebarId: null,
  hoveredRebarId: null,
  isolateSelected: false,
  showDimensions: true,
  showRebarLabels: false,
  explode: 0,
  set: (patch) => set(patch),
}));
