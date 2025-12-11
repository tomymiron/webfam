import { resultGetter } from "../../constants/resultGetter";
import { useEffect, useState, useCallback } from "react";
import { shortDate } from "../../constants/timeGetter";

export default function AthleteResultItem({ event, unit, result, date, location }) {
  useEffect(() => {import("./styles/athleteResultItem.scss")}, []);

  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = useCallback(() => setIsOpen(v => !v), []);
  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleOpen();
    }
  }, [toggleOpen]);

  return (
    <div className={`athleteResultItem${isOpen ? " open" : ""}`} role="button" tabIndex={0} aria-expanded={isOpen} onClick={toggleOpen} onKeyDown={onKeyDown}>
      <div className="top">
        <p className="event">{event}</p>
        <p className="mark">{resultGetter(result, unit)}</p>
      </div>
      <div className="bottom">
        <p className="date">{shortDate(date)}</p>
        <p className="location">{location.toUpperCase()}</p>
      </div>
    </div>
  );
}
