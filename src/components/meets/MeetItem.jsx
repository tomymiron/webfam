import { dateOnlyFormatter, timeLeft, timeSince } from "../../constants/timeGetter";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function MeetItem({ meet }) {
  useEffect(() => {import("./styles/meetItem.scss")}, []);
  const navigate = useNavigate();

  const events = meet?.events?.split("#");
  
  // Determinar si la competencia ya pasó
  const isPast = () => {
    if (!meet?.date) return false;
    const meetDate = new Date(meet.date);
    const now = new Date();
    return meetDate < now;
  };

  const past = isPast();

  const handleClick = () => {
    navigate(`/meet/${meet.id}`);
  }

  return (
    <button className="meetItem" style={{ opacity: meet.visible ? 1 : 0.5 }} role="button" tabIndex={0} onClick={handleClick}>
      <p className="date">{dateOnlyFormatter(meet.date)}</p>

      <p className="eventsTitle">Pruebas</p>
      <div className="events">
        {events?.length > 0 ? events?.map((event, index) => <p key={index}>{event}</p>): <p>No hay pruebas</p>}
      </div>

      <div className="spacer" />

      <p className="name">{meet.name}</p>
      <p className="location">{meet.place_name}, {meet.place_address}</p>
      <p className="timeLeft">{past ? `hace ${timeSince(meet.date)}` : `en ${timeLeft(meet.date)}`}</p>
    </button>
  );
}