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
  set: (patch: Partial<ViewState>) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  showGrid: false,
  postFx: true,
  concreteOpacity: 0.08,
  showConcrete: true,
  showRebar: true,
  showStirrups: true,
  showLongitudinal: true,
  renderMode: 'role',
  clipEnabled: false,
  clipAxis: 'x',
  clipPosition: 0,
  selectedRebarId: null,
  set: (patch) => set(patch),
}));
