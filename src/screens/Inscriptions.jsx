import "material-react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { makeRequest } from "../config/axios";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useEffect, useMemo, useRef } from "react";
import { dateFullFormatter, timeLeft } from "../constants/timeGetter";
import RankingTable from "../components/RankingTable";

function Inscriptions() {
  useEffect(() => {import("./styles/inscriptions.scss")}, []);
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: meet, isLoading: isLoadingMeet } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}`).then((res) => res.data),
    queryKey: ["meet", id],
  });

  const { data: inscriptions, isLoading: isLoadingInscriptions } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/inscriptions/all`).then((res) => res.data),
    queryKey: ["meetInscriptions", id],
  });

  const getGenderLabel = (gender) => {
    switch(gender) {
      case 1: return "Hombres";
      case 2: return "Mujeres";
      case 3: return "Mixto";
      default: return "N/A";
    }
  };

  // Agrupar inscripciones por evento y ordenar por marca
  const groupedInscriptions = useMemo(() => {
    if (!inscriptions || !Array.isArray(inscriptions) || inscriptions.length === 0) return {};

    const grouped = {};
    
    inscriptions.forEach((inscription) => {
      const eventKey = `${inscription.event_id}_${inscription.event_gender}_${inscription.discipline_alias}`;
      
      if (!grouped[eventKey]) {
        grouped[eventKey] = {
          eventKey,
          event_id: inscription.event_id,
          discipline_alias: inscription.discipline_alias,
          discipline_name: inscription.discipline_name,
          discipline_unit: inscription.discipline_unit,
          event_gender: inscription.event_gender,
          event_time: inscription.event_time,
          inscriptions: []
        };
      }
      
      grouped[eventKey].inscriptions.push(inscription);
    });

    // Ordenar inscripciones dentro de cada evento por marca: pista (unit 's') menor es mejor; campo (unit 'm' u otro) mayor es mejor
    Object.keys(grouped).forEach((key) => {
      const unit = grouped[key].discipline_unit;
      const lowerIsBetter = unit === "s";
      grouped[key].inscriptions.sort((a, b) => {
        if (a.mark === null && b.mark === null) return 0;
        if (a.mark === null) return 1;
        if (b.mark === null) return -1;
        return lowerIsBetter ? a.mark - b.mark : b.mark - a.mark;
      });
    });

    // Ordenar eventos: primero por género (Hombres, Mujeres, Mixto) y dentro de cada uno por horario
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const eventA = grouped[a];
      const eventB = grouped[b];

      // Primero género (1 = Hombres, 2 = Mujeres, 3 = Mixto)
      if (eventA.event_gender !== eventB.event_gender) {
        return eventA.event_gender - eventB.event_gender;
      }

      // Dentro de cada género, ordenar por horario ascendente
      if (eventA.event_time !== eventB.event_time) {
        return (eventA.event_time || '').localeCompare(eventB.event_time || '');
      }

      return (eventA.discipline_alias || '').localeCompare(eventB.discipline_alias || '');
    });

    const sorted = {};
    sortedKeys.forEach(key => {
      sorted[key] = grouped[key];
    });

    return sorted;
  }, [inscriptions]);

  const getGenderLetter = (gender) => {
    switch (gender) {
      case 1: return "M";
      case 2: return "F";
      case 3: return "X";
      default: return "?";
    }
  };

  const eventsForChips = useMemo(() => {
    if (!groupedInscriptions || Object.keys(groupedInscriptions).length === 0) return [];
    return Object.entries(groupedInscriptions)
      .map(([eventKey, group]) => ({
        eventKey,
        label: `${getGenderLetter(group.event_gender)} | ${group.discipline_alias || group.discipline_name || ""}`.trim(),
        count: group.inscriptions.length
      }))
      .sort((a, b) => b.count - a.count);
  }, [groupedInscriptions]);

  const eventSectionRefs = useRef({});

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5).replace(':', '.') + "hs";
  };

  // Transformar inscripciones para RankingTable
  const transformInscriptionsForTable = (inscriptions, discipline, unit) => {
    return inscriptions.map((inscription, index) => {
      const markValue = inscription.mark !== null && inscription.mark !== undefined ? parseFloat(inscription.mark) : null;
      // Asegurar que el unit esté disponible: primero de la inscripción individual, luego del grupo, luego null
      const unitValue = inscription.discipline_unit || unit || null;
      
      // Debug: verificar que el unit esté disponible
      if (markValue && !unitValue) {
        console.warn('Missing unit for mark:', markValue, 'inscription:', inscription);
      }
      
      return {
        position: String(index + 1).padStart(3, '0'),
        best_mark: markValue,
        unit: unitValue,
        athlete_name: inscription.user_name,
        athlete_born: inscription.birth_year || (inscription.born ? new Date(inscription.born).getFullYear() : "N/A"),
        club_alias: inscription.club_alias || inscription.club_name || "-",
        discipline: discipline,
        athlete_id: inscription.user_id,
        inscription_id: inscription.id
      };
    });
  };

  if (isLoadingMeet || isLoadingInscriptions) {
    return <div>Cargando...</div>;
  }

  return (
    <div id="Inscriptions">
      <nav>
        <button id="backButton" onClick={() => navigate(`/meet/${id}`)}>
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
            <p id="meetTimeLeft">{meet?.date && dateFullFormatter(meet.date)}</p>
            <div id="meetTitleRow">
              <p id="meetDate">INSCRIPTOS</p>
            </div>
            <p id="meetName">{meet?.name}</p>

            {eventsForChips.length > 0 && (
              <div className="eventChipsScroll">
                <div className="eventChips">
                  {eventsForChips.map((chip) => (
                    <button
                      key={chip.eventKey}
                      type="button"
                      className="eventChip"
                      onClick={() => eventSectionRefs.current[chip.eventKey]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {Object.keys(groupedInscriptions).length > 0 ? (
            Object.values(groupedInscriptions).map((eventGroup) => {
              const tableData = transformInscriptionsForTable(
                eventGroup.inscriptions,
                eventGroup.discipline_alias || eventGroup.discipline_name,
                eventGroup.discipline_unit
              );
              
              return (
                <div
                  key={eventGroup.event_id}
                  id="eventInscriptions"
                  ref={(el) => { if (eventGroup.eventKey) eventSectionRefs.current[eventGroup.eventKey] = el; }}
                >
                  <div id="eventInscriptionsHeader">
                    <h2>{getGenderLabel(eventGroup.event_gender)} {eventGroup.discipline_alias || eventGroup.discipline_name}</h2>
                    <p>{eventGroup.event_time && formatTime(eventGroup.event_time)}</p>
                  </div>
                  
                  <RankingTable
                    data={tableData}
                    main="athlete_id"
                    showMedals={false}
                    toShowColumns={[
                      { key: "position", label: "#", align: "center", fixed: true, bold: true, minWidth: 64 },
                      { key: "best_mark", label: "Marca", align: "right", fixed: true },
                      { key: "athlete_name", label: "Atleta", align: "left", bold: true },
                      { key: "athlete_born", label: "FDN", align: "right" },
                      { key: "club_alias", label: "Club", align: "left" },
                      { key: "discipline", label: "Prueba", align: "right" },
                    ]}
                  />

                  <div className="separator"/>
                </div>
              );
            })
          ) : (
            <p className="emptyMessage">No hay inscriptos en esta competencia</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Transition(Inscriptions);
