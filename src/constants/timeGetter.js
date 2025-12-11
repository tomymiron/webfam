export function shortDate(date) {
  try {
      const d = new Date(date);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
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
  const elapsedSeconds = Math.floor((now.getTime() - utcDate.getTime()) / 1000);

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

  return Math.abs(Math.floor(elapsedSeconds)) + 's';
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