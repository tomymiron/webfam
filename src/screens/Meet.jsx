import { dateFullFormatter, timeLeft, shortDate } from "../constants/timeGetter";

// Función helper para determinar si las inscripciones están abiertas
const isInscriptionOpen = (available) => {
  if (!available) return false; // Si es null, está cerrado
  const availableDate = new Date(available);
  const now = new Date();
  return availableDate > now; // Si la fecha límite es futura, está abierto
};
import InscriptionItem from "../components/meets/InscriptionItem";
import { useNavigate, useParams } from "react-router-dom";
import "material-react-toastify/dist/ReactToastify.css";
import EventItem from "../components/meets/EventItem";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useEffect } from "react";

function Meet() {
  useEffect(() => {import("./styles/meet.scss")}, []);
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: meet, isLoading: isLoadingMeet, isError: isErrorMeet } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}`).then((res) => res.data),
    queryKey: ["meet", id],
  });

  const { data: events, isLoading: isLoadingEvents, isError: isErrorEvents } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/events`).then((res) => res.data),
    queryKey: ["events", id],
  });

  const { data: eventsAvailable, isLoading: isLoadingEventsAvailable, isError: isErrorEventsAvailable, error: eventsAvailableError } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/events/available`, { headers: { Authorization: authState?.token, }}).then((res) => res.data),
    enabled: !!authState?.authenticated,
    queryKey: ["eventsAvailable", id],
    retry: (failureCount, error) => {
      // No retry on 403 errors (not enabled)
      if (error?.response?.status === 403) return false;
      return failureCount < 3;
    },
  });

  if(!meet || !events) return <div>Cargando...</div>

  const handleMapClick = () =>{ 
    const address = encodeURIComponent(meet.place_address || meet.place_name);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(url, "_blank");
  }

  const handleProgramClick = () => {
    if (meet.program) {
      const programUrl = `${import.meta.env.VITE_API_URL}/image/program/${meet.program}`;
      window.open(programUrl, "_blank");
    }
  }

  return (
    <div id="Meet">
      <nav>
        <button id="backButton" onClick={() => navigate("/meets")}>
          <Icon name="left-arrow" size={24} color={COLORS.black_01} />
        </button>

        <button id="profileButton" onClick={() => navigate(authState.authenticated ? "/athlete" : "/login")}>
          {authState.authenticated ? <>
            <Icon name="user" size={24} color={COLORS.black_01} />
            <p>{authState?.user?.name}</p>
          </> : <>
            <Icon name="fam" size={24} color={COLORS.black_01} />
            <p>WEBFAM</p>
          </>}
        </button>
      </nav>

      <main>
        <section>
          <div id="meetHeader">
            <p id="meetTimeLeft">en {timeLeft(meet.date)}</p>
            <p id="meetDate">{dateFullFormatter(meet.date)}</p>
            <p id="meetName">{meet.name}</p>

            <div id="meetTags">
              <button className="tag" onClick={handleMapClick} type="button" >
                <Icon name="map" size={18} color={COLORS.white_01} />
                <p>{meet.place_name}</p>
              </button>
              {meet.program && (
                <button className="tag" onClick={handleProgramClick} type="button">
                  <Icon name="pdf" size={18} color={COLORS.white_01} />
                  <p>Programa & Horarios</p>
                </button>
              )}
              {authState.authenticated && meet.athletes > 1 && (
                <button onClick={() => navigate(`/inscriptions/${id}`)}>
                  <p>Ver {meet.athletes} Inscriptos</p>
                </button>
              )}

              {/* Tag de NO habilitado si hay error 403 */}
              {authState.authenticated && eventsAvailableError?.response?.status === 403 && (
                <p className="tag disabled">NO estás habilitado</p>
              )}


              <p className={isInscriptionOpen(meet.available) ? 'tag open' : 'tag closed'}>{isInscriptionOpen(meet.available) ? `Inscripciones hasta ${shortDate(meet.available)}` : 'Inscripciones cerradas' }</p>
            </div>
          </div>

          <div id="meetEvents">
            <h4>Horarios de Pruebas</h4>

            {events?.male.length > 0 && (
              <div className="meetEventsContainer">
                <p className="meetEventsTitle">Hombres</p>
                {events?.male.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            )}

            {events?.female.length > 0 && (
              <div className="meetEventsContainer">
                <p className="meetEventsTitle">Mujeres</p>
                {events?.female.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            )}

            {events?.mixed.length > 0 && (
              <div className="meetEventsContainer">
                <p className="meetEventsTitle">Mixto</p>
                {events?.mixed.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>

        </section>
        {authState.authenticated && (() => {
          // Verificar si las inscripciones están abiertas y el atleta está habilitado
          if (!meet.available) return null; // Si es null, está cerrado
          const availableDate = new Date(meet.available);
          const now = new Date();
          const isOpen = availableDate > now;
          const isEnabled = eventsAvailableError?.response?.status !== 403; // No mostrar si error 403 (no habilitado)

          return isOpen && isEnabled ? (
            <section>
              <div id="headerSpacer"/>

              <div id="meetInscription">
                <h4>Inscribite</h4>
                {eventsAvailable?.map((inscription) => (
                  <InscriptionItem key={inscription.id} inscription={inscription} />
                ))}
              </div>

            </section>
          ) : null;
        })()}
      </main>

    </div>
  )
}

export default Transition(Meet);