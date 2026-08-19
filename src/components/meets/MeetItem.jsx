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

export default function MeetItem({ meet, isClub = false, linkToResults = false }) {
  useEffect(() => {import("./styles/meetItem.scss")}, []);
  const navigate = useNavigate();

  const eventsList = meet?.events?.split("#") ?? [];
  const maxVisible = 5;
  const visibleEvents = eventsList.slice(0, maxVisible);
  const remainingCount = Math.max(0, eventsList.length - maxVisible);

  // Comparación de día en UTC (mismo criterio que el backend)
  const getMeetDayUTC = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  const now = new Date();
  const todayStartUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const meetDayUTC = getMeetDayUTC(meet?.date);

  // Determinar si la competencia ya pasó (comparar solo el día en UTC)
  const past = meetDayUTC != null && meetDayUTC < todayStartUTC;

  // Es el día del evento (hoy en UTC)
  const isToday = meetDayUTC != null && meetDayUTC === todayStartUTC;

  // Determinar si las inscripciones están abiertas
  const inscriptionOpen = isInscriptionOpen(meet?.available);

  const handleClick = () => {
    if (linkToResults) return navigate(`/meet/${meet.id}/results`);
    if (isClub) return navigate(`/club/meet/${meet.id}`);
    navigate(`/meet/${meet.id}`);
  };

  const isClickable = true;

  return (
    <button
      className="meetItem"
      style={{ opacity: past ? 0.65 : 1 }}
      role="button"
      tabIndex={isClickable ? 0 : -1}
      onClick={isClickable ? handleClick : undefined}
      disabled={!isClickable}
    >
      <p className="date">{isToday ? "Hoy" : dateOnlyFormatter(meet.date)}</p>

      {!past && (
        <>
          <p className="eventsTitle">Pruebas</p>
          <div className="events">
            {eventsList.length > 0 ? (
              <>
                {visibleEvents.map((event, index) => (
                  <p key={index}>{event}</p>
                ))}
                {remainingCount > 0 && (
                  <p className="moreEvents">+{remainingCount} pruebas</p>
                )}
              </>
            ) : (
              <p>No hay pruebas</p>
            )}
          </div>
        </>
      )}

      <div className="spacer" />

      {!past && <p className={`inscriptionDeadline ${inscriptionOpen ? 'open' : 'closed'}`}>
        {inscriptionOpen ? `Inscripciones hasta ${shortDate(meet.available)}` : `Inscripciones cerradas` }
      </p>}
      <p className="name">{meet.name}</p>
      <p className="location">{meet.place_name}{meet.place_description ? ` · ${meet.place_description}` : ""}, {meet.place_address}</p>
      
      <p className="timeLeft">{past ? `hace ${timeSince(meet.date)}` : isToday ? "Hoy" : `en ${timeLeft(meet.date)}`}</p>
    </button>
  );
}