import { timeGetter, timeLeft } from "../constants/timeGetter";
import { useNavigate, useParams } from "react-router-dom";
import "material-react-toastify/dist/ReactToastify.css";
import RankingTable from "../components/RankingTable";
import { COLORS, SIZES } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import { useEffect, useState } from "react";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import Select from "react-select";

const customStyles = {
  container: (base) => ({
    ...base,
    minWidth: "100%",
    width: "100%",
  }),
  control: (base, state) => ({
    ...base,
    backgroundColor: COLORS.black_01,
    borderColor: COLORS.black_01,
    padding: "8px 12px",
    minHeight: "54px",
    boxShadow: "none",
    minWidth: "100%",
    borderRadius: 0,
    outline: "none",
    borderWidth: 1,
    width: "100%",
    "&:hover": {
      borderColor: COLORS.black_01,
    },
  }),
  valueContainer: (base) => ({
    ...base,
    justifyContent: "flex-start",
    alignContent: "center",
    alignItems: "center",
    flexWrap: "nowrap",
    lineHeight: 1.2,
    columnGap: 0,
    padding: 0,
    margin: 0,
    rowGap: 0,
    gap: 0,
  }),
  singleValue: (base) => ({
    ...base,
    color: COLORS.white_01,
    fontWeight: 600,
    fontSize: SIZES.f5,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: COLORS.white_01,
    padding: "4px",
  }),
  placeholder: (base) => ({
    ...base,
    color: COLORS.white_02,
    fontSize: SIZES.f5,
    fontWeight: 400,
    margin: 0,
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: COLORS.white_01,
    overflow: "hidden",
    borderRadius: 6,
    border: `1px solid ${COLORS.black_01}`,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? COLORS.purple_01 : COLORS.white_01,
    color: state.isFocused ? COLORS.white_01 : COLORS.black_01,
    fontWeight: 600,
    fontSize: SIZES.f5,
    padding: "8px 12px",
    cursor: "pointer",
    ":active": {
      backgroundColor: COLORS.purple_01,
      color: COLORS.white_01,
    }
  }),
};

function Inscriptions() {
  useEffect(() => {import("./styles/inscriptions.scss")}, []);
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [gender, setGender] = useState(1);

  const { data: meet, isLoading: isLoadingMeet, isError: isErrorMeet } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}`).then((res) => res.data),
    queryKey: ["meet", id],
  });

  const { data: inscriptions, isLoading: isLoadingInscriptions, isError: isErrorInscriptions, isRefetching: isRefetchingInscriptions } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${event?.id}/inscriptions`).then((res) => res.data),
    queryKey: ["inscriptions", event],
    enabled: !!event,
  });

  const { data: events, isLoading: isLoadingEvents, isError: isErrorEvents } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/events`).then((res) => res.data),
    queryKey: ["events", id],
  });

  const formatEventsForSelect = (eventsArray) => {
    if (!eventsArray) return [];
    return eventsArray.map(event => {
      const hasCategories = Array.isArray(event?.categories) && event.categories.length > 0;
      const categoriesText = hasCategories ? `, ${event.categories.join(" - ")}` : "";
      return {
        value: event.id,
        label: `${event.discipline}${categoriesText}`,
        ...event
      };
    });
  };
  const getCurrentEvents = () => {
    if (!events) return [];
    const genderKey = gender === 1 ? "male" : gender === 2 ? "female" : "mixed";
    return formatEventsForSelect(events[genderKey]);
  };
  useEffect(() => {
    const currentEvents = getCurrentEvents();
    if (currentEvents.length > 0) {
      setEvent(currentEvents[0]);
    }
  }, [events, gender]);

  if(!meet || !events || !event) return <div>Cargando...</div>

  return (
    <div id="Inscriptions">
      <nav>
        <button id="backButton" onClick={() => navigate(-1)}>
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
            <p id="meetDate">INSCRIPTOS</p>
            <p id="meetName">{meet.name}</p>
              <div id="meetTags">
                <div id="eventSelect">
                  <Select 
                    options={getCurrentEvents()} 
                    onChange={setEvent} 
                    value={event} 
                    styles={customStyles} 
                    placeholder={isLoadingEvents ? "Cargando eventos..." : "Selecciona un evento"} 
                    isLoading={isLoadingEvents} 
                    isDisabled={isLoadingEvents}
                    getOptionValue={(option) => option.value}
                    getOptionLabel={(option) => option.label}
                    isSearchable={false}
                  />
                </div>
                {events.male && events.male.length > 0 && (
                  <button className={gender === 1 ? "active" : ""} onClick={() => setGender(1)}>
                    <p>Hombres</p>
                  </button>
                )}
                {events.female && events.female.length > 0 && (
                  <button className={gender === 2 ? "active" : ""} onClick={() => setGender(2)}>
                    <p>Mujeres</p>
                  </button>
                )}
                {events.mixed && events.mixed.length > 0 && (
                  <button className={gender === 3 ? "active" : ""} onClick={() => setGender(3)}>
                    <p>Mixto</p>
                  </button>
                )}
            </div>
          </div>

          <div id="eventInscriptions">
            <div id="eventInscriptionsHeader">
              <h2>{event.discipline} {gender === 1 ? "Hombres" : gender === 2 ? "Mujeres" : "Mixto"}</h2>
              <p>{event.categories.join(" - ")} {event.categories.length > 1 && <strong>|</strong>} {timeGetter(event.time)}</p>
            </div>

            {isLoadingInscriptions || isRefetchingInscriptions ?
              <div id="inscriptionsLoadingContainer">
                <div className="loadingSpinner" />
              </div>
            : (inscriptions && inscriptions?.length > 0) ?
              <RankingTable
                toShowColumns={[
                  { key: "position", label: "#", align: "center", fixed: true, bold: true, minWidth: 64 },
                  { key: "best_mark", label: "Marca", align: "right", fixed: true, },
                  { key: "athlete_name", label: "Atleta", align: "left", bold: true },
                  { key: "athlete_born", label: "FDN", align: "right" },
                  { key: "club_alias", label: "Club", align: "left" },
                  { key: "discipline", label: "Prueba", align: "right" },
                ]}
                main="athlete_id"
                data={inscriptions}
              />
            : 
              <div id="noInscriptionsContainer">
                <p>Aún no hay inscripciones!</p>
              </div>
            }
          </div>
        </section>
      </main>

    </div>
  )
}

export default Transition(Inscriptions);