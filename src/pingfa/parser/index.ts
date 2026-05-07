import type { RebarGrade } from '@/three/rebar/types';

export interface RebarSpec {
  count: number;
  diameter: number;
  grade: RebarGrade;
}

export interface BeamMainSpec {
  /** 排数；rows[0] 为最外排（贴近箍筋） */
  rows: RebarSpec[][];
}

export interface StirrupSpec {
  diameter: number;
  grade: RebarGrade;
  spacingDense: number;     // 加密区间距
  spacingNormal: number;    // 非加密区间距
  legs: number;             // 肢数
}

export interface ColumnSpec {
  total: number;
  diameter: number;
  grade: RebarGrade;
}

/** 把 "Φ/A/C/D" 单字母 → 钢筋等级 */
function letterToGrade(c: string): RebarGrade {
  switch (c.toUpperCase()) {
    case 'A':
    case 'Φ':
      return 'HPB300';
    case 'C':
    case 'B': // 也常用 B 表示 HRB400
      return 'HRB400';
    case 'D':
      return 'HRB500';
    default:
      return 'HRB400';
  }
}

/** 解析单段如 "4C25" / "2C25+2C22" / "4C25 2/2" */
export function parseRebarGroup(s: string): BeamMainSpec {
  const trimmed = s.trim();
  // 分排：含空格 + N/M 表达式
  const rows: RebarSpec[][] = [];
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && /^\d+\/\d+/.test(parts[1])) {
    // 形如 "4C25 2/2"：第一段是钢筋，第二段是排数分布
    const main = parseSimple(parts[0]);
    const dist = parts[1].split('/').map((n) => parseInt(n, 10));
    let consumed = 0;
    for (const d of dist) {
      const row: RebarSpec[] = [];
      let need = d;
      // 按主筋按比例切分
      for (const item of main) {
        const remain = item.count - consumed;
        if (remain <= 0) continue;
        const take = Math.min(need, remain);
        if (take > 0) {
          row.push({ ...item, count: take });
          need -= take;
          consumed += take;
          if (need === 0) break;
        }
      }
      rows.push(row);
    }
    return { rows };
  }
  rows.push(parseSimple(trimmed));
  return { rows };
}

function parseSimple(s: string): RebarSpec[] {
  // "4C25+2C22"
  const out: RebarSpec[] = [];
  for (const seg of s.split('+')) {
    const m = seg.trim().match(/^(\d+)\s*([A-Za-zΦφ])\s*(\d+)/);
    if (!m) continue;
    out.push({ count: parseInt(m[1], 10), grade: letterToGrade(m[2]), diameter: parseInt(m[3], 10) });
  }
  return out;
}

/** 解析箍筋 "C8@100/200(4)" 或 "C8@200(2)" */
export function parseStirrup(s: string): StirrupSpec | null {
  const m = s.trim().match(/^([A-Za-zΦφ])\s*(\d+)\s*@\s*(\d+)(?:\s*\/\s*(\d+))?\s*(?:\((\d+)\))?/);
  if (!m) return null;
  return {
    grade: letterToGrade(m[1]),
    diameter: parseInt(m[2], 10),
    spacingDense: parseInt(m[3], 10),
    spacingNormal: m[4] ? parseInt(m[4], 10) : parseInt(m[3], 10),
    legs: m[5] ? parseInt(m[5], 10) : 2,
  };
}

/** 解析板/墙均布筋 "C10@150" */
export function parseUniformBar(s: string): { diameter: number; grade: RebarGrade; spacing: number } | null {
  const m = s.trim().match(/^([A-Za-zΦφ])\s*(\d+)\s*@\s*(\d+)/);
  if (!m) return null;
  return { grade: letterToGrade(m[1]), diameter: parseInt(m[2], 10), spacing: parseInt(m[3], 10) };
}

export interface BeamPingfa {
  name?: string;
  spans?: number;
  width?: number;
  height?: number;
  stirrup: StirrupSpec | null;
  topMain: BeamMainSpec | null;
  bottomMain: BeamMainSpec | null;
}

/**
 * 简化解析梁集中标注：
 *   "KL1(2A) 300x600 C8@100/200(2) 2C25;4C25"
 *   分号 ; 分隔 上部 ; 下部；若只有一段则视为通长贯通
 */
export function parseBeamPingfa(s: string): BeamPingfa {
  const text = s.replace(/\s+/g, ' ').trim();
  const out: BeamPingfa = {
    stirrup: null, topMain: null, bottomMain: null,
  };
  const nameMatch = text.match(/^(KL|L|WKL|JZL)\d+(?:\s*\(([^)]*)\))?/i);
  if (nameMatch) {
    out.name = nameMatch[0];
    if (nameMatch[2]) {
      const sp = nameMatch[2].match(/\d+/);
      if (sp) out.spans = parseInt(sp[0], 10);
    }
  }
  const dim = text.match(/(\d{2,4})\s*[x×*]\s*(\d{2,4})/);
  if (dim) { out.width = parseInt(dim[1], 10); out.height = parseInt(dim[2], 10); }
  const stir = text.match(/[A-DΦφ]\d+\s*@\s*\d+(?:\s*\/\s*\d+)?(?:\s*\(\d+\))?/);
  if (stir) out.stirrup = parseStirrup(stir[0]);
  // 主筋部分：取分号或末尾段
  const mainPart = text.replace(stir?.[0] ?? '', '').replace(dim?.[0] ?? '', '').replace(nameMatch?.[0] ?? '', '');
  const segs = mainPart.split(';').map((x) => x.trim()).filter(Boolean);
  if (segs.length === 2) {
    out.topMain = parseRebarGroup(segs[0]);
    out.bottomMain = parseRebarGroup(segs[1]);
  } else if (segs.length === 1) {
    out.topMain = parseRebarGroup(segs[0]);
    out.bottomMain = parseRebarGroup(segs[0]);
  }
  return out;
}

export interface ColumnPingfa {
  name?: string;
  width?: number;
  depth?: number;
  longitudinal: ColumnSpec | null;
  stirrup: StirrupSpec | null;
}

export function parseColumnPingfa(s: string): ColumnPingfa {
  const text = s.replace(/\s+/g, ' ').trim();
  const out: ColumnPingfa = { longitudinal: null, stirrup: null };
  const nameM = text.match(/^(KZ|GZ|LZ|XZ)\d+/i);
  if (nameM) out.name = nameM[0];
  const dim = text.match(/(\d{2,4})\s*[x×*]\s*(\d{2,4})/);
  if (dim) { out.width = parseInt(dim[1], 10); out.depth = parseInt(dim[2], 10); }
  const stir = text.match(/[A-DΦφ]\d+\s*@\s*\d+(?:\s*\/\s*\d+)?(?:\s*\(\d+\))?/);
  if (stir) out.stirrup = parseStirrup(stir[0]);
  // 总配筋形如 "12C22" 或 "4C25+8C22"
  const longM = text.match(/(\d+)\s*([A-DΦφ])\s*(\d+)(?!\s*@)/);
  if (longM) {
    out.longitudinal = {
      total: parseInt(longM[1], 10),
      grade: letterToGrade(longM[2]),
      diameter: parseInt(longM[3], 10),
    };
  }
  return out;
}
