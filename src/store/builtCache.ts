import { create } from 'zustand';
import { useEffect } from 'react';
import type { Rebar } from '@/three/rebar/types';

interface BuiltCacheState {
  rebars: Rebar[];
  set: (r: Rebar[]) => void;
}

export const useBuiltCache = create<BuiltCacheState>((set) => ({
  rebars: [],
  set: (r) => set({ rebars: r }),
}));

/** 在组件渲染时把当前构件已构建的钢筋登记到全局缓存（供右侧明细表使用） */
export function useRegisterBuiltRebars(rebars: Rebar[]) {
  const setCache = useBuiltCache((s) => s.set);
  useEffect(() => {
    setCache(rebars);
  }, [rebars, setCache]);
}
