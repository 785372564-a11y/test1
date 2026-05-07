import { useMemo, useState } from 'react';
import { useBuiltCache } from '@/store/builtCache';
import { useViewStore } from '@/store/viewStore';
import { FilletedPolylineCurve3, defaultBendRadius } from '@/three/rebar/RebarCurve';
import { PanelRightClose, PanelRightOpen, ListOrdered } from 'lucide-react';
import type { Rebar } from '@/three/rebar/types';

const ROLE_LABEL: Record<string, string> = {
  topMain: '上部受力', bottomMain: '下部受力', stirrup: '箍筋', longitudinal: '柱纵筋',
  slabTop: '板顶', slabBottom: '板底', wallVertical: '墙竖', wallHorizontal: '墙水平',
  foundationBottom: '基础底', sideStruct: '侧构造', sideTorsion: '侧抗扭', erection: '架立',
};

function rebarLength(r: Rebar): number {
  const c = new FilletedPolylineCurve3(r.polyline, r.bendRadius ?? defaultBendRadius(r.diameter, r.grade));
  return c.getLength();
}

interface AggRow {
  key: string;
  role: string;
  diameter: number;
  grade: string;
  count: number;
  unitLen: number; // mm
  totalLen: number;
  weight: number;  // kg
}

const DENSITY_KG_PER_MM3 = 7.85e-6; // 钢密度

export default function RebarTable() {
  const rebars = useBuiltCache((s) => s.rebars);
  const sel = useViewStore((s) => s.selectedRebarId);
  const setSel = useViewStore((s) => s.set);
  const [collapsed, setCollapsed] = useState(false);

  const rows = useMemo<AggRow[]>(() => {
    const map = new Map<string, AggRow>();
    for (const r of rebars) {
      const len = rebarLength(r);
      const count = (r.instances?.length ?? 1);
      const key = `${r.role}|${r.grade}|${r.diameter}`;
      const area = Math.PI * (r.diameter / 2) ** 2;
      const w = len * count * area * DENSITY_KG_PER_MM3;
      const cur = map.get(key);
      if (cur) {
        cur.count += count;
        cur.totalLen += len * count;
        cur.weight += w;
      } else {
        map.set(key, {
          key, role: r.role, diameter: r.diameter, grade: r.grade,
          count, unitLen: len, totalLen: len * count, weight: w,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.role.localeCompare(b.role));
  }, [rebars]);

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);

  if (collapsed) {
    return (
      <button
        className="absolute top-20 right-4 z-10 panel w-10 h-10 grid place-items-center text-slate-300 hover:text-white"
        onClick={() => setCollapsed(false)}
        title="展开钢筋明细"
      >
        <PanelRightOpen size={18} />
      </button>
    );
  }

  return (
    <div className="absolute top-20 right-4 z-10 w-[300px]">
      <div className="panel max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/60">
          <ListOrdered size={14} className="text-sky-400" />
          <span className="text-sm font-semibold flex-1">钢筋明细</span>
          <span className="text-[11px] text-slate-500">{rows.length} 类</span>
          <button className="btn-ghost" onClick={() => setCollapsed(true)} title="收起">
            <PanelRightClose size={16} />
          </button>
        </div>
        <div className="overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="bg-slate-800/40 sticky top-0 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-1.5 font-semibold">类型</th>
                <th className="text-right px-2 py-1.5 font-semibold">规格</th>
                <th className="text-right px-2 py-1.5 font-semibold">数量</th>
                <th className="text-right px-3 py-1.5 font-semibold">重量</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-slate-800/60 hover:bg-slate-800/40">
                  <td className="px-3 py-1.5 text-slate-200">{ROLE_LABEL[r.role] ?? r.role}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-slate-300">{r.grade.replace('HRB', 'C').replace('HPB', 'A')}{r.diameter}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-400">{r.count}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-300">{r.weight.toFixed(1)}<span className="text-slate-600 ml-0.5">kg</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">总重</span>
          <span className="font-mono text-sky-400 text-sm font-semibold tabular-nums">{totalWeight.toFixed(2)} kg</span>
        </div>
        {sel && (
          <div className="px-3 py-1.5 border-t border-slate-700/60 text-xs text-slate-400 flex items-center gap-2">
            <span>选中</span>
            <span className="font-mono text-sky-400 flex-1 truncate">{sel}</span>
            <button className="btn-ghost text-[11px]" onClick={() => setSel({ selectedRebarId: null })}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}
