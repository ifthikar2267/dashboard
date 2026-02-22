export function calculatePoints(basePrice) {
  const price = parseFloat(basePrice) || 0;
  return {
    almosafer_points: +(price * 0.1).toFixed(2),
    shukran_points: +(price * 0.2).toFixed(2),
  };
}

/**
 * Calculate package pricing points from base price.
 * @param {number|string} basePrice - Base price value
 * @returns {{ almosafer_points: number, shukran_points: number }}
 */
export function calculatePackagePricing(basePrice) {
  const price = parseFloat(basePrice) || 0;
  return {
    almosafer_points: +(price * 0.1).toFixed(2),
    shukran_points: +(price * 0.2).toFixed(2),
  };
}