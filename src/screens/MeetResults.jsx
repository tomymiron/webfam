import "material-react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { makeRequest } from "../config/axios";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { dateFullFormatter } from "../constants/timeGetter";
import { resultGetter, formatWeight } from "../constants/resultGetter";
import RankingTable from "../components/RankingTable";
import { toast } from "material-react-toastify";

function MeetResults() {
  useEffect(() => { import("./styles/meetResults.scss"); }, []);
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [refreshingEvents, setRefreshingEvents] = useState(new Set());

  const { data: meet, isLoading: isLoadingMeet } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}`).then((res) => res.data),
    queryKey: ["meet", id],
  });

  const { data: eventsResults, isLoading: isLoadingResults, refetch: refetchResults } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/results`).then((res) => res.data),
    queryKey: ["meetResults", id],
  });

  const handleRefreshEvent = async (eventId) => {
    setRefreshingEvents(prev => new Set(prev).add(eventId));
    try {
      await refetchResults();
      toast.success("Resultados actualizados", { theme: "colored" });
    } catch (error) {
      toast.error("Error al actualizar resultados", { theme: "colored" });
    } finally {
      setRefreshingEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const getGenderLabel = (gender) => {
    switch (gender) {
      case 1: return "Hombres";
      case 2: return "Mujeres";
      case 3: return "Mixto";
      default: return "N/A";
    }
  };

  const getGenderLetter = (gender) => {
    switch (gender) {
      case 1: return "M";
      case 2: return "F";
      case 3: return "X";
      default: return "?";
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return String(timeString).substring(0, 5).replace(":", ".") + "hs";
  };

  // Función para convertir horario a minutos desde medianoche para ordenar
  const parseTimeToMinutes = (timeString) => {
    if (!timeString) return 0;
    const s = String(timeString).trim();
    const part = s.includes("T") ? s.split("T")[1] : s;
    const [h, m] = (part || "").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Ordenar eventos: primero por género (hombres=1, mujeres=2, mixto=3), luego por horario
  const sortedEventsResults = useMemo(() => {
    if (!eventsResults || !Array.isArray(eventsResults) || eventsResults.length === 0) return [];
    return [...eventsResults].sort((a, b) => {
      // Primero ordenar por género: hombres (1) primero, luego mujeres (2), luego mixto (3)
      if (a.event_gender !== b.event_gender) {
        const genderOrder = { 1: 1, 2: 2, 3: 3 }; // Hombres primero, luego mujeres, luego mixto
        return (genderOrder[a.event_gender] || 999) - (genderOrder[b.event_gender] || 999);
      }
      // Si mismo género, ordenar por horario (más temprano primero)
      const timeA = parseTimeToMinutes(a.event_time);
      const timeB = parseTimeToMinutes(b.event_time);
      return timeA - timeB;
    });
  }, [eventsResults]);

  const eventsForChips = useMemo(() => {
    if (!sortedEventsResults || sortedEventsResults.length === 0) return [];
    return sortedEventsResults.map((ev, idx) => ({
      eventKey: ev.event_id,
      label: `${getGenderLetter(ev.event_gender)} | ${ev.discipline_alias || ev.discipline_name || ""}`.trim(),
      count: (ev.results?.length || 0) + (ev.status_entries?.length || 0) + (ev.pending_entries?.length || 0),
    }));
  }, [sortedEventsResults]);

  const eventSectionRefs = useRef({});

  const buildTableDataForEvent = (eventData) => {
    const unit = eventData.discipline_unit || "m";
    const lowerIsBetter = unit === "s";
    const results = eventData.results || [];
    const statusEntries = eventData.status_entries || [];
    const pendingEntries = eventData.pending_entries || [];

    const sortedResults = [...results].sort((a, b) => {
      const ra = a.result != null ? parseFloat(a.result) : (lowerIsBetter ? 999999 : -999999);
      const rb = b.result != null ? parseFloat(b.result) : (lowerIsBetter ? 999999 : -999999);
      return lowerIsBetter ? ra - rb : rb - ra;
    });

    const hasWind = !!eventData.discipline_is_wind;
    const hasWeight = !!eventData.discipline_is_weight;

    const numericRows = sortedResults.map((row, index) => {
      const resultNum = row.result != null ? parseFloat(row.result) : null;
      const resultDisplay = resultNum != null ? resultGetter(resultNum, unit) : "—";
      const windDisplay = hasWind && row.wind != null && row.wind !== "" ? parseFloat(row.wind).toFixed(1) : "—";
      const weightDisplay = hasWeight && row.weight != null ? (formatWeight(row.weight) || "—") : "—";
      return {
        position: String(index + 1).padStart(3, "0"),
        result_display: resultDisplay,
        wind_display: windDisplay,
        weight_display: weightDisplay,
        athlete_name: row.user_name,
        athlete_born: row.birth_year ?? "—",
        club_alias: row.club_alias || "—",
        discipline: eventData.discipline_alias || eventData.discipline_name,
        athlete_id: row.user_id,
      };
    });

    const statusRows = statusEntries.map((row) => ({
      position: "—",
      result_display: row.result_status || "—",
      wind_display: "—",
      weight_display: "—",
      athlete_name: row.user_name,
      athlete_born: row.birth_year ?? "—",
      club_alias: row.club_alias || "—",
      discipline: eventData.discipline_alias || eventData.discipline_name,
      athlete_id: row.user_id,
    }));

    const pendingRows = pendingEntries.map((row) => ({
      position: "—",
      result_display: "Pendiente",
      wind_display: "—",
      weight_display: "—",
      athlete_name: row.user_name,
      athlete_born: row.birth_year ?? "—",
      club_alias: row.club_alias || "—",
      discipline: eventData.discipline_alias || eventData.discipline_name,
      athlete_id: row.user_id,
    }));

    return { numericRows, statusRows, pendingRows, hasWind, hasWeight };
  };

  if (isLoadingMeet || isLoadingResults) {
    return <div className="loadingMessage">Cargando...</div>;
  }

  const hasAnyResults = sortedEventsResults && Array.isArray(sortedEventsResults) && sortedEventsResults.some(
    (ev) => (ev.results && ev.results.length > 0) || (ev.status_entries && ev.status_entries.length > 0) || (ev.pending_entries && ev.pending_entries.length > 0)
  );

  const getResultsColumns = (hasWind, hasWeight) => {
    const cols = [
      { key: "position", label: "#", align: "center", fixed: true, bold: true, minWidth: 64 },
      { key: "result_display", label: "Resultado", align: "right", fixed: true },
    ];
    if (hasWind) cols.push({ key: "wind_display", label: "Viento", align: "right" });
    if (hasWeight) cols.push({ key: "weight_display", label: "Peso", align: "right" });
    cols.push(
      { key: "athlete_name", label: "Atleta", align: "left", bold: true },
      { key: "athlete_born", label: "FDN", align: "right" },
      { key: "club_alias", label: "Club", align: "left" },
      { key: "discipline", label: "Prueba", align: "right" }
    );
    return cols;
  };

  const getStatusColumns = (hasWind, hasWeight) => {
    const cols = [
      { key: "position", label: "#", align: "center", fixed: true, minWidth: 64 },
      { key: "result_display", label: "Estado", align: "right", fixed: true },
    ];
    if (hasWind) cols.push({ key: "wind_display", label: "Viento", align: "right" });
    if (hasWeight) cols.push({ key: "weight_display", label: "Peso", align: "right" });
    cols.push(
      { key: "athlete_name", label: "Atleta", align: "left", bold: true },
      { key: "athlete_born", label: "FDN", align: "right" },
      { key: "club_alias", label: "Club", align: "left" },
      { key: "discipline", label: "Prueba", align: "right" }
    );
    return cols;
  };

  return (
    <div id="MeetResults">
      <nav>
        <button type="button" id="backButton" onClick={() => navigate(`/meet/${id}`)}>
          <Icon name="left-arrow" size={24} color={COLORS.black_01} />
        </button>
        <button type="button" id="profileButton" onClick={() => navigate(authState.authenticated ? "/athlete" : "/login")}>
          {authState.authenticated ? (
            <>
              <Icon name="user" size={24} color={COLORS.black_01} />
              <p>{authState?.user?.name}</p>
            </>
          ) : (
            <>
              <Icon name="fam" size={24} color={COLORS.black_01} />
              <p>WEBFAM</p>
            </>
          )}
        </button>
      </nav>

      <main>
        <section>
          <div id="meetHeader">
            <p id="meetTimeLeft">{meet?.date && dateFullFormatter(meet.date)}</p>
            <div id="meetTitleRow">
              <p id="meetDate">RESULTADOS</p>
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

          {hasAnyResults ? (
            sortedEventsResults.map((eventData) => {
              const { numericRows, statusRows, pendingRows, hasWind, hasWeight } = buildTableDataForEvent(eventData);

              return (
                <div
                  key={eventData.event_id}
                  id="eventResults"
                  ref={(el) => { if (eventData.event_id) eventSectionRefs.current[eventData.event_id] = el; }}
                >
                  <div className="eventResultsHeader">
                    <h2>{getGenderLabel(eventData.event_gender)} {eventData.discipline_alias || eventData.discipline_name}</h2>
                    <div className="eventTimeWithRefresh">
                      <span>{formatTime(eventData.event_time)} |</span>
                      <button
                        type="button"
                        className="refreshButton"
                        onClick={() => handleRefreshEvent(eventData.event_id)}
                        disabled={refreshingEvents.has(eventData.event_id)}
                      >
                        {refreshingEvents.has(eventData.event_id) ? "Actualizando..." : "Actualizar"}
                      </button>
                    </div>
                  </div>

                  {numericRows.length > 0 && (
                    <RankingTable
                      data={numericRows}
                      main="athlete_id"
                      showMedals={true}
                      toShowColumns={getResultsColumns(hasWind, hasWeight)}
                    />
                  )}

                  {statusRows.length > 0 && (
                    <>
                      <p className="statusSectionTitle">Sin marca</p>
                      <RankingTable
                        data={statusRows}
                        main="athlete_id"
                        showMedals={false}
                        toShowColumns={getStatusColumns(hasWind, hasWeight)}
                      />
                    </>
                  )}

                  {pendingRows.length > 0 && (
                    <>
                      <p className="statusSectionTitle">Pendiente</p>
                      <RankingTable
                        data={pendingRows}
                        main="athlete_id"
                        showMedals={false}
                        toShowColumns={getResultsColumns(hasWind, hasWeight)}
                      />
                    </>
                  )}

                  <div className="separator" />
                </div>
              );
            })
          ) : (
            <p className="emptyMessage">Aún no hay resultados publicados para esta competencia</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Transition(MeetResults);
