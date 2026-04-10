import "material-react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useAuthClub } from "../contexts/AuthContextClub";
import { makeRequest } from "../config/axios";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { dateFullFormatter } from "../constants/timeGetter";
import { resultGetter, formatWeight } from "../constants/resultGetter";
import RankingTable from "../components/RankingTable";
import { toast } from "material-react-toastify";

function MeetResults() {
  useEffect(() => { import("./styles/meetResults.scss"); }, []);
  const { authState } = useAuth();
  const { authState: clubAuthState } = useAuthClub();
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
      case 1: return "H";
      case 2: return "M";
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
    return sortedEventsResults.map((ev, idx) => {
      const flags = [ev.event_only_fam ? "FAM" : null, ev.event_label].filter(Boolean).join(" ");
      return {
        eventKey: ev.event_id,
        label: `${getGenderLetter(ev.event_gender)} | ${ev.discipline_alias || ev.discipline_name || ""}${flags ? " | " + flags : ""}`.trim(),
        count: (ev.results?.length || 0) + (ev.status_entries?.length || 0) + (ev.pending_entries?.length || 0),
        event_only_fam: ev.event_only_fam,
        event_admin_only: ev.event_admin_only,
      };
    });
  }, [sortedEventsResults]);

  const eventSectionRefs = useRef({});
  const mainRef = useRef(null);
  const prevShowScrollTopRef = useRef(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (prevShowScrollTopRef.current && !showScrollTop) setIsExiting(true);
    prevShowScrollTopRef.current = showScrollTop;
  }, [showScrollTop]);

  const handleScroll = useCallback(() => {
    const windowScroll = window.scrollY ?? document.documentElement.scrollTop;
    const mainScroll = mainRef.current?.scrollTop ?? 0;
    const scrolled = Math.max(windowScroll, mainScroll);
    const threshold = window.innerHeight; // 100vh
    setShowScrollTop(scrolled > threshold);
  }, []);

  useEffect(() => {
    handleScroll();
    const el = mainRef.current;
    window.addEventListener("scroll", handleScroll, { passive: true });
    el?.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mainRef.current?.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const scrollToTop = () => {
    const el = mainRef.current;
    if (el?.scrollTop > 0) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

    const disciplineLabel = eventData.discipline_alias || eventData.discipline_name || "";
    const formatPruebaWithCategory = (categoryName) => {
      const cat = categoryName ? String(categoryName).trim() : "";
      if (!cat) return disciplineLabel;
      const label = /master/i.test(cat) ? "Mayores" : cat;
      return `${label} - ${disciplineLabel}`;
    };

    const rowWithCategory = (row, extra = {}) => ({
      ...extra,
      athlete_name: row.user_name,
      athlete_born: row.birth_year ?? "—",
      club_alias: row.club_alias || "—",
      discipline: formatPruebaWithCategory(row.category_name),
      athlete_id: row.user_id,
    });

    const numericRows = sortedResults.map((row, index) => {
      const resultNum = row.result != null ? parseFloat(row.result) : null;
      const resultDisplay = resultNum != null ? resultGetter(resultNum, unit) : "—";
      const windDisplay = hasWind && row.wind != null && row.wind !== "" ? parseFloat(row.wind).toFixed(1) : "—";
      const weightDisplay = hasWeight && row.weight != null ? (formatWeight(row.weight) || "—") : "—";
      return rowWithCategory(row, {
        position: String(index + 1).padStart(3, "0"),
        result_display: resultDisplay,
        wind_display: windDisplay,
        weight_display: weightDisplay,
      });
    });

    const statusRows = statusEntries.map((row) =>
      rowWithCategory(row, {
        position: "—",
        result_display: row.result_status || "—",
        wind_display: "—",
        weight_display: "—",
      })
    );

    const pendingRows = pendingEntries.map((row) =>
      rowWithCategory(row, {
        position: "—",
        result_display: "Pendiente",
        wind_display: "—",
        weight_display: "—",
      })
    );

    return { numericRows, statusRows, pendingRows, hasWind, hasWeight };
  };

  // Agrupa filas por peso (weight_display) cuando la prueba tiene peso. Clave "" para sin peso.
  const groupRowsByWeight = (rows, hasWeight) => {
    if (!hasWeight || !rows.length) return [{ key: "", rows }];
    const groups = {};
    rows.forEach((row) => {
      const key = row.weight_display && row.weight_display !== "—" ? row.weight_display : "—";
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    return Object.entries(groups).map(([key, r]) => ({ key, rows: r }));
  };

  if (isLoadingMeet || isLoadingResults) {
    return <div className="loadingMessage">Cargando...</div>;
  }

  const hasAnyResults = sortedEventsResults && Array.isArray(sortedEventsResults) && sortedEventsResults.some(
    (ev) => (ev.results && ev.results.length > 0) || (ev.status_entries && ev.status_entries.length > 0) || (ev.pending_entries && ev.pending_entries.length > 0) || (ev.relay_teams && ev.relay_teams.length > 0)
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
        <button type="button" id="profileButton" onClick={() => navigate(clubAuthState?.authenticated ? "/club" : authState.authenticated ? "/athlete" : "/login")}>
          {clubAuthState?.authenticated ? (
            <>
              <Icon name="users-group" size={24} color={COLORS.black_01} />
              <p>{clubAuthState?.club?.alias || "Club"}</p>
            </>
          ) : authState.authenticated ? (
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

      <main ref={mainRef}>
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
                      className={`eventChip${chip.event_only_fam ? " fam" : ""}${chip.event_admin_only ? " adminOnly" : ""}`}
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
              const isRelay = eventData.relay_teams?.length > 0;
              const { numericRows, statusRows, pendingRows, hasWind, hasWeight } = buildTableDataForEvent(eventData);

              return (
                <div
                  key={eventData.event_id}
                  id="eventResults"
                  ref={(el) => { if (eventData.event_id) eventSectionRefs.current[eventData.event_id] = el; }}
                >
                  <div className="eventResultsHeader">
                    <h2>
                      {getGenderLabel(eventData.event_gender)} {eventData.discipline_alias || eventData.discipline_name}
                      {eventData.event_only_fam ? <span className="eventBadge fam">FAM</span> : null}
                      {eventData.event_label ? <span className="eventBadge label">{eventData.event_label}</span> : null}
                    </h2>
                    <div className="eventTimeWithRefresh">
                      <span>{formatTime(eventData.event_time)}{eventData.event_categories ? ` | ${eventData.event_categories}` : ""} |</span>
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

                  {isRelay ? (() => {
                    // Separar equipos con marca, con status, y sin nada
                    const withResult = eventData.relay_teams.filter(t => t.result != null && !t.status);
                    const withStatus = eventData.relay_teams.filter(t => t.status);
                    const pending = eventData.relay_teams.filter(t => t.result == null && !t.status);

                    const sortedWithResult = [...withResult].sort((a, b) => a.result - b.result);

                    const renderTeam = (team, position) => (
                      <div key={team.relay_id} className={`relayResultTeam${team.status ? " statusTeam" : ""}`}>
                        <div className="relayResultPosition">{position}</div>
                        <div className="relayResultTeamInfo">
                          <p className="relayResultClub">{team.club_alias || team.club_name}</p>
                          <div className="relayResultAthletes">
                            {team.athletes?.map(a => (
                              <span key={a.user_id}>{a.user_name}</span>
                            ))}
                          </div>
                        </div>
                        <div className="relayResultMark">
                          {team.status ? team.status : team.result != null ? resultGetter(team.result, "s") : "—"}
                        </div>
                      </div>
                    );

                    return (
                      <div className="relayResultsList">
                        {sortedWithResult.map((team, idx) => renderTeam(team, idx + 1))}
                        {withStatus.length > 0 && (
                          <>
                            <p className="statusSectionTitle">Sin marca</p>
                            {withStatus.map(team => renderTeam(team, team.status))}
                          </>
                        )}
                        {pending.length > 0 && (
                          <>
                            <p className="statusSectionTitle">Pendiente</p>
                            {pending.map(team => renderTeam(team, "—"))}
                          </>
                        )}
                      </div>
                    );
                  })() : (
                    <>
                      {numericRows.length > 0 &&
                        groupRowsByWeight(numericRows, hasWeight).map(({ key: weightKey, rows }) => (
                          <div key={weightKey || "numeric"} className="weightGroup">
                            {hasWeight && weightKey && weightKey !== "—" && (
                              <p className="weightGroupTitle">Peso {weightKey}</p>
                            )}
                            <RankingTable
                              data={rows}
                              main="athlete_id"
                              showMedals={true}
                              toShowColumns={getResultsColumns(hasWind, hasWeight)}
                            />
                          </div>
                        ))}

                      {statusRows.length > 0 && (
                        <>
                          <p className="statusSectionTitle">Sin marca</p>
                          {groupRowsByWeight(statusRows, hasWeight).map(({ key: weightKey, rows }) => (
                            <div key={`status-${weightKey || "all"}`} className="weightGroup">
                              {hasWeight && weightKey && weightKey !== "—" && (
                                <p className="weightGroupTitle">Peso {weightKey}</p>
                              )}
                              <RankingTable
                                data={rows}
                                main="athlete_id"
                                showMedals={false}
                                toShowColumns={getStatusColumns(hasWind, hasWeight)}
                              />
                            </div>
                          ))}
                        </>
                      )}

                      {pendingRows.length > 0 && (
                        <>
                          <p className="statusSectionTitle">Pendiente</p>
                          {groupRowsByWeight(pendingRows, hasWeight).map(({ key: weightKey, rows }) => (
                            <div key={`pending-${weightKey || "all"}`} className="weightGroup">
                              {hasWeight && weightKey && weightKey !== "—" && (
                                <p className="weightGroupTitle">Peso {weightKey}</p>
                              )}
                              <RankingTable
                                data={rows}
                                main="athlete_id"
                                showMedals={false}
                                toShowColumns={getResultsColumns(hasWind, hasWeight)}
                              />
                            </div>
                          ))}
                        </>
                      )}
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

      {(showScrollTop || isExiting) && (
        <button
          type="button"
          className={`scrollToTopButton${isExiting ? " exiting" : ""}`}
          onClick={scrollToTop}
          onAnimationEnd={() => {
            if (isExiting) setTimeout(() => setIsExiting(false), 50);
          }}
          aria-label="Subir arriba"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default Transition(MeetResults);
