/**
 * 梁端箍筋加密区长度（22G101-1）：
 *  一级抗震：max(2h_b, 500)
 *  二~四级抗震：max(1.5h_b, 500)
 * 这里取一级（保守）。
 */
export function beamStirrupZoneLen(beamHeight: number): number {
  return Math.max(2 * beamHeight, 500);
}

/**
 * 柱端箍筋加密区：max(Hn/6, max(hc,bc), 500)
 */
export function columnStirrupZoneLen(netHeight: number, sectionMax: number): number {
  return Math.max(netHeight / 6, sectionMax, 500);
}
