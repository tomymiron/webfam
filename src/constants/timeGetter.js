export function shortDate(date) {
    try{
        function join(date, options, separator) {
          function format(option) {
              let formatter = new Intl.DateTimeFormat("es", option);
              return formatter.format(date);
          }
          return options.map(format).join(separator);
        }
        let options = [{ day: "numeric" }, { month: "numeric" }, { year: "numeric" }];
        let dateMid = join(new Date(date), options, "/");
        let dateEnd = date.slice(-8, -3);
        let eventDate = dateMid + " | " + dateEnd + "hs";
        return eventDate;
    }catch(err){
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
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) throw new Error('Invalid date');
    
    const formatter = new Intl.DateTimeFormat('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    
    const formatted = formatter.format(dateObj);
    const [weekday, ...rest] = formatted.split(' ');
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const time = date.slice(-8, -3);
    
    return `${capitalizedWeekday} ${rest.join('/')} -- ${time}hs`.replace(",", "");
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

export function formatTime12h (time) {
  if (!time) return "";
  let [hour, minute] = time.split(":");
  hour = parseInt(hour, 10);
  const isPM = hour >= 12;
  let displayHour = hour % 12 === 0 ? 12 : hour % 12;
  let suffix = isPM ? "PM" : "AM";
  displayHour = hour;
  suffix = hour >= 12 ? "PM" : "AM";
  return `${displayHour}${minute !== "00" ? `:${minute}` : ""}${suffix}`;
};

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

  // Si la fecha ya pasó, retornar "Pasado"
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