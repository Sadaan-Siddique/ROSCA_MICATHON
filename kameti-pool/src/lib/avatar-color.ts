/** Deterministic accent for member avatars (no backend field). */
export function avatarColorFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `oklch(0.72 0.14 ${hue})`;
}
