import { resultGetter, formatWeight } from "../../constants/resultGetter";
import { useEffect, useState, useCallback } from "react";
import { shortDate } from "../../constants/timeGetter";

export default function AthleteResultItem({ event, unit, result, date, location, wind, weight, isWind, isWeight }) {
  useEffect(() => {import("./styles/athleteResultItem.scss")}, []);

  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = useCallback(() => setIsOpen(v => !v), []);
  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleOpen();
    }
  }, [toggleOpen]);

  // Función para formatear el viento
  const formatWind = (windValue) => {
    if (!windValue && windValue !== 0) return null;
    const windNum = parseFloat(windValue);
    if (isNaN(windNum)) return null;
    const sign = windNum >= 0 ? '+' : '';
    return `${sign}${windNum.toFixed(1)} m/s`;
  };

  return (
    <div className={`athleteResultItem${isOpen ? " open" : ""}`} role="button" tabIndex={0} aria-expanded={isOpen} onClick={toggleOpen} onKeyDown={onKeyDown}>
      <div className="top">
        <p className="event">{event}</p>
        <p className="mark">{resultGetter(result, unit)}</p>
      </div>
      <div className="bottom">
        <p className="date">{shortDate(date)}</p>
        <p className="location">{location.toUpperCase()}</p>
        {(isWind && wind !== null && wind !== undefined) || (isWeight && weight !== null && weight !== undefined) ? (
          <div className="additionalInfo">
            {isWind == 1 && wind !== null && wind !== undefined && (
              <span className="wind">{formatWind(wind)}</span>
            )}
            {isWeight == 1 && weight !== null && weight !== undefined && (
              <span className="weight">{formatWeight(weight)}</span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
