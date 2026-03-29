// Stock alert thresholds by category
const STOCK_THRESHOLDS = {
  'Gaseosa': 6,
  'Carnes': 20,
  'Papas': 1,
  'Insumos': 100,
  'Panes': 20,
  'Cerveza': 6,
  'Agua': 6,
  'Agua saborizada': 6,
  'Empanadas': 4,
  'Verdura': 10,
  'Condimentos': 5,
  'Fiambres': 15,
};

/**
 * Get the stock alert threshold for a product category
 * @param {string} category - Product category
 * @returns {number|null} Threshold value or null if category not found
 */
function getThreshold(category) {
  return STOCK_THRESHOLDS[category] || null;
}

/**
 * Check if a product should trigger a stock alert
 * @param {string} category - Product category
 * @param {number} stock - Current stock level
 * @returns {boolean} True if should alert
 */
function shouldAlert(category, stock) {
  const threshold = getThreshold(category);
  if (threshold === null) return false;
  return stock <= threshold;
}

export {
  STOCK_THRESHOLDS,
  getThreshold,
  shouldAlert,
};
