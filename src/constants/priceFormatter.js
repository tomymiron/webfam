/**
 * Formats a price number with thousands separator using dots
 * @param {number} price - The price value to format
 * @returns {string} Formatted price string (e.g., 9500 -> "9.500")
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) {
    return '0';
  }

  // Convert to string and format with dots as thousands separators
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

