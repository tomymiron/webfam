/**
 * Calcula la categoría de un atleta basándose únicamente en el año de nacimiento
 * La edad se calcula como: año actual - año de nacimiento (sin importar mes/día)
 * 
 * Categorías:
 * - U12: 0-11 años
 * - U14: 12-13 años
 * - U16: 14-15 años
 * - U18: 16-17 años
 * - U20: 18-19 años
 * - U23: 20-22 años
 * - Mayores: 23+ años
 * 
 * @param {string|Date|number} birthDate - Fecha de nacimiento (puede ser string "YYYY-MM-DD", Date, o número)
 * @returns {string} Categoría del atleta
 */
export const categoryGetter = (birthDate) => {
  if (!birthDate) {
    return 'N/A';
  }

  const currentYear = new Date().getFullYear();
  let birthYear;

  // Manejar diferentes formatos de fecha
  if (typeof birthDate === 'string') {
    // Limpiar el string (eliminar espacios, etc.)
    const cleanDate = birthDate.trim();
    
    // Si es string, extraer el año (formato "YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", o "YYYY")
    if (cleanDate.includes('-')) {
      // Extraer el año de formatos como "2007-07-26" o "2007-07-26T00:00:00.000Z"
      const yearPart = cleanDate.split('-')[0];
      birthYear = parseInt(yearPart, 10);
    } else if (cleanDate.includes('T')) {
      // Formato ISO: "2007-07-26T00:00:00.000Z"
      const dateObj = new Date(cleanDate);
      birthYear = dateObj.getFullYear();
    } else {
      // Solo año como string
      birthYear = parseInt(cleanDate, 10);
    }
  } else if (birthDate instanceof Date) {
    birthYear = birthDate.getFullYear();
  } else if (typeof birthDate === 'number') {
    // Si es un número (año directo)
    birthYear = parseInt(birthDate, 10);
  } else {
    // Intentar convertir a string y luego parsear
    const dateStr = String(birthDate).trim();
    if (dateStr.includes('-')) {
      birthYear = parseInt(dateStr.split('-')[0], 10);
    } else {
      birthYear = parseInt(dateStr, 10);
    }
  }

  // Validar que el año sea un número válido y razonable
  if (isNaN(birthYear) || birthYear < 1900 || birthYear > currentYear) {
    return 'N/A';
  }

  // Calcular edad solo por año (sin considerar mes/día)
  const age = currentYear - birthYear;
  
  // Aplicar las reglas de categorías (orden importante: de mayor a menor)
  if (age >= 23) {
    return 'Mayores';
  } else if (age >= 20 && age <= 22) {
    return 'U23';
  } else if (age >= 18 && age <= 19) {
    return 'U20';
  } else if (age >= 16 && age <= 17) {
    return 'U18';
  } else if (age >= 14 && age <= 15) {
    return 'U16';
  } else if (age >= 12 && age <= 13) {
    return 'U14';
  } else if (age >= 0 && age <= 11) {
    return 'U12';
  } else {
    return 'N/A';
  }
}