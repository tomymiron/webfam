// Mapeo de IDs de weight a pesos reales (en gramos)
const throwsWeightsMap = {
  1: 400,    // Jabalina 400g
  2: 500,    // Jabalina 500g
  3: 600,    // Jabalina 600g
  4: 700,    // Jabalina 700g
  5: 800,    // Jabalina 800g
  6: 3000,   // Bala 3kg
  7: 4000,   // Bala 4kg
  8: 5000,   // Bala 5kg
  9: 6000,   // Bala 6kg
  10: 7260,  // Bala 7.26kg
  11: 3000,  // Martillo 3kg
  12: 4000,  // Martillo 4kg
  13: 5000,  // Martillo 5kg
  14: 6000,  // Martillo 6kg
  15: 7260,  // Martillo 7.26kg
  16: 750,   // Disco 750g
  17: 1000,  // Disco 1kg
  18: 1500,  // Disco 1.5kg
  19: 1750,  // Disco 1.75kg
  20: 2000   // Disco 2kg
};

export const formatWeight = (weightId) => {
  if (!weightId || weightId === null || weightId === undefined) return null;

  const weightIdNum = parseInt(weightId);
  if (isNaN(weightIdNum) || !throwsWeightsMap[weightIdNum]) return null;

  const weightInGrams = throwsWeightsMap[weightIdNum];

  // Si es mayor o igual a 1000g, mostrar en kg, sino en gramos
  if (weightInGrams >= 1000) {
    return `${(weightInGrams / 1000).toFixed(2)} kg`;
  } else {
    return `${weightInGrams} g`;
  }
};

export const resultGetter = (result, unit) => {
  if (unit === "s") {
    const timeInSeconds = result;
    
    if (timeInSeconds >= 60) {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      const centiseconds = Math.round((timeInSeconds % 1) * 100);
      
      const formattedCentiseconds = centiseconds.toString().padStart(2, '0');
      
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${formattedCentiseconds}`;
    }
    
    return `${timeInSeconds.toFixed(2)}s`;
  } else if (unit === "m") {
    return `${parseFloat(result).toFixed(2)}m`;
  }

  return result;
}