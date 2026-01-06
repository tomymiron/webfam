export function shortDate(date) {
  try {
      // Parsear fecha manualmente para evitar problemas de zona horaria
      let d;
    let hasTime = false;
    let timePart = '';

    if (typeof date === 'string') {
      // Si incluye espacio, es formato datetime "YYYY-MM-DD HH:MM:SS"
      if (date.includes(' ')) {
        const parts = date.split(' ');
        const datePart = parts[0];
        timePart = parts[1] || '';
        const [year, month, day] = datePart.split('-').map(Number);
        d = new Date(year, month - 1, day);

        // Si hay hora, parsearla también
        if (timePart && timePart.includes(':')) {
          const [hour, minute] = timePart.split(':').map(Number);
          d.setHours(hour, minute, 0, 0);
          hasTime = true;
        }
      } else if (date.includes('-')) {
        // Formato solo fecha "YYYY-MM-DD"
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(date);
      }
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) throw new Error('Invalid date');

      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();

    let result = `${day}/${month}/${year}`;

    // Si hay hora, incluirla
    if (hasTime && timePart) {
      const [hour, minute] = timePart.split(':').slice(0, 2).map(Number);
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      result += ` ${formattedHour}:${formattedMinute}`;
    }

    return result;
  } catch (err) {
      return "???";
  }
}

export function dateOnlyFormatter(date) {
  try {
    const datePart = date.split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error('Invalid date');

    const dayStr = day < 10 ? `0${day}` : `${day}`;

    const MONTHS = [ "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE" ];

    const monthStr = MONTHS[month - 1] || "???";

    return `${dayStr} ${monthStr}`;
  } catch (err) {
    console.log(err);
    return "???";
  }
}

export function dateFullFormatter(date) {
  try {
    const datePart = date.split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error('Invalid date');

    const d = new Date(year, month - 1, day);

    const WEEKDAYS = [
      "DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"
    ];
    const MONTHS = [
      "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
      "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];

    const weekdayStr = WEEKDAYS[d.getDay()] || "???";
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const monthStr = MONTHS[month - 1] || "???";

    return `${weekdayStr} ${dayStr} DE ${monthStr}`;
  } catch (err) {
    console.log(err);
    return "???";
  }
}

export function timeSince(date) {
  if (!date) return "???";

  let parsedDate;
  if (typeof date === "string" && date.length >= 19) {
    // MySQL devuelve TIMESTAMP como string "YYYY-MM-DD HH:MM:SS" en hora local del servidor
    // Parsear manualmente los componentes para crear fecha como hora local
    const [datePart, timePart] = date.split(" ");
    if (!datePart || !timePart) return "???";
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    // Crear fecha en hora local (sin Date.UTC para que use la zona horaria del navegador)
    parsedDate = new Date(year, month - 1, day, hour, minute, second);
  } else {
    // Parsear fecha manualmente si es formato YYYY-MM-DD
    if (typeof date === 'string' && date.length === 10 && date.includes('-')) {
      const [year, month, day] = date.split('-').map(Number);
      parsedDate = new Date(year, month - 1, day);
    } else {
      parsedDate = new Date(date);
    }
  }

  if (isNaN(parsedDate.getTime())) return "???";

  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);
  
  // Si elapsedSeconds es negativo (fecha futura), retornar 0s
  if (elapsedSeconds < 0) return '0s';

  const INTERVALS = [
    { seconds: 31536000, label: 'años' },
    { seconds: 2592000, label: 'M' },
    { seconds: 86400, label: 'd' },
    { seconds: 3600, label: 'hs' },
    { seconds: 60, label: 'm' }
  ];

  for (const { seconds, label } of INTERVALS) {
    const interval = elapsedSeconds / seconds;
    if (interval >= 1) return Math.floor(interval) + label;
  }

  return elapsedSeconds >= 0 ? Math.floor(elapsedSeconds) + 's' : '0s';
}


export function timeLeft(date) {
  if (!date) return "???";

  let utcDate;
  if (typeof date === "string" && date.length >= 19) {
    const [datePart, timePart] = date.split(" ");
    if (!datePart || !timePart) return "???";
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  } else utcDate = new Date(date);

  if (isNaN(utcDate.getTime())) return "???";

  const now = new Date();
  const remainingSeconds = Math.floor((utcDate.getTime() - now.getTime()) / 1000);

  if (remainingSeconds <= 0) return "Pasado";

  const INTERVALS = [
    { seconds: 31536000, label: 'años' },
    { seconds: 2592000, label: 'M' },
    { seconds: 86400, label: 'd' },
    { seconds: 3600, label: 'hs' },
    { seconds: 60, label: 'm' }
  ];

  for (const { seconds, label } of INTERVALS) {
    const interval = remainingSeconds / seconds;
    if (interval >= 1) return Math.floor(interval) + label;
  }

  return Math.floor(remainingSeconds) + 's';
}

export function timeGetter(mysqlTime) {
  try {
    if (!mysqlTime) return "???";
    
    const [hours, minutes] = mysqlTime.split(':');
    if (!hours || !minutes) return "???";
    
    const hourNum = parseInt(hours, 10);
    const minuteNum = parseInt(minutes, 10);
    
    if (isNaN(hourNum) || isNaN(minuteNum)) return "???";
    
    const formattedHour = hourNum.toString().padStart(2, '0');
    const formattedMinute = minuteNum.toString().padStart(2, '0');
    
    return `${formattedHour}.${formattedMinute}hs`;
  } catch (err) {
    console.log(err);
    return "???";
  }
}