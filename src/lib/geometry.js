/**
 * Clamp a numeric value between min and max bounds.
 * @param {number} value input value
 * @param {number} min minimum inclusive
 * @param {number} max maximum inclusive
 */
export function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert normalized coordinates to pixel coordinates for a board size.
 * @param {{x: number, y: number}} point normalized (0-1)
 * @param {{width: number, height: number}} size
 */
export function toPixels(point, size) {
  return {
    x: clamp(point.x, 0, 1) * size.width,
    y: clamp(point.y, 0, 1) * size.height
  };
}

export function rotationDeltaDegrees(a, b) {
  const diff = ((a - b) % 360 + 360) % 360;
  return diff > 180 ? 360 - diff : diff;
}
