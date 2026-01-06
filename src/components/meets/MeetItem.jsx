import { dateOnlyFormatter, timeLeft, timeSince, shortDate } from "../../constants/timeGetter";

// Función helper para determinar si las inscripciones están abiertas
const isInscriptionOpen = (available) => {
  if (!available) return false; // Si es null, está cerrado
  const availableDate = new Date(available);
  const now = new Date();
  return availableDate > now; // Si la fecha límite es futura, está abierto
};
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function MeetItem({ meet, isClub = false }) {
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

  // Determinar si las inscripciones están abiertas
  const inscriptionOpen = isInscriptionOpen(meet?.available);

  const handleClick = () => {
    if(isClub) return navigate(`/club/meet/${meet.id}`);
    navigate(`/meet/${meet.id}`);
  }

  return (
    <button
      className="meetItem"
      style={{ opacity: (meet.visible && !past) ? 1 : 0.65 }}
      role="button"
      tabIndex={past ? -1 : 0}
      onClick={past ? undefined : handleClick}
      disabled={past}
    >
      <p className="date">{dateOnlyFormatter(meet.date)}</p>

      {!past && (
        <>
          <p className="eventsTitle">Pruebas</p>
          <div className="events">
            {events?.length > 0 ? events?.map((event, index) => <p key={index}>{event}</p>): <p>No hay pruebas</p>}
          </div>
        </>
      )}

      <div className="spacer" />

      {!past && <p className={`inscriptionDeadline ${inscriptionOpen ? 'open' : 'closed'}`}>
        {inscriptionOpen ? `Inscripciones hasta ${shortDate(meet.available)}` : `Inscripciones cerradas` }
      </p>}
      <p className="name">{meet.name}</p>
      <p className="location">{meet.place_name}, {meet.place_address}</p>
      
      <p className="timeLeft">{past ? `hace ${timeSince(meet.date)}` : `en ${timeLeft(meet.date)}`}</p>
    </button>
  );
}