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
    return `${result}m`;
  }

  return result;
}