/** 跑马灯从当前位移接着走，而不是每次暂停后再从 0 开始。 */
export function marqueeDelaySeconds(translateX: number, trackWidth: number, durationSeconds: number): number {
  if (!(trackWidth > 0) || !(durationSeconds > 0) || !Number.isFinite(translateX)) return 0;
  const progress = Math.min(1, Math.max(0, -translateX / (trackWidth / 2)));
  if (progress === 0) return 0;
  return -progress * durationSeconds;
}
