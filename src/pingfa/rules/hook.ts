/**
 * 箍筋 135° 弯钩平直段长度。22G101-1 抗震要求：max(10d, 75mm)
 */
export function stirrupHookLen(diameter: number): number {
  return Math.max(10 * diameter, 75);
}
