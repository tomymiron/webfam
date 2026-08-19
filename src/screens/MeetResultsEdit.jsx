import "material-react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { dateFullFormatter } from "../constants/timeGetter";
import { toast } from "material-react-toastify";
import Select from "react-select";

const STATUS_OPTIONS = [
  { value: "", label: "—" },
  { value: "DQ", label: "DQ" },
  { value: "DNS", label: "DNS" },
  { value: "DNF", label: "DNF" },
];

function formatResultForInput(val, unit) {
  if (val === "" || val == null) return "";
  if (unit !== "s") return String(val);
  const str = String(val).trim();
  const dotCount = (str.match(/\./g) || []).length;
  if (dotCount >= 2) return str;
  const num = parseFloat(str);
  if (Number.isNaN(num)) return str;
  if (num >= 60) {
    const min = Math.floor(num / 60);
    const sec = num % 60;
    const secWhole = Math.floor(sec);
    const centis = Math.round((sec - secWhole) * 100);
    return `${min}.${String(secWhole).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }
  return num.toFixed(2);
}

function parseResultInput(str, unit) {
  if (!str || String(str).trim() === "") return null;
  const s = String(str).trim();
  if (unit !== "s") {
    const n = parseFloat(s);
    return Number.isNaN(n) ? null : n;
  }
  const dotCount = (s.match(/\./g) || []).length;
  if (dotCount >= 2) {
    const parts = s.split(".");
    const min = parseInt(parts[0], 10) || 0;
    const secStr = parts.slice(1).join(".");
    const sec = parseFloat(secStr) || 0;
    return min * 60 + sec;
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

const weightSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: "38px",
    borderColor: "rgba(0, 0, 0, 0.25)",
    borderWidth: "2px",
    borderRadius: "4px",
    boxShadow: "none",
    "&:hover": { borderColor: "rgba(0, 0, 0, 0.4)" },
    "&:focus-within": { borderColor: COLORS.purple_01, boxShadow: `0 0 0 3px ${COLORS.purple_01}20` },
  }),
  singleValue: (base) => ({ ...base, color: COLORS.black_01, fontWeight: 500 }),
  placeholder: (base) => ({ ...base, color: "rgba(0, 0, 0, 0.45)" }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "rgba(0, 0, 0, 0.06)" : "white",
    color: COLORS.black_01,
    cursor: "pointer",
  }),
  indicatorSeparator: () => ({ display: "none" }),
};

function MeetResultsEdit() {
  useEffect(() => { import("./styles/meetResultsEdit.scss"); }, []);
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const queryClient = useQueryClient();
  const [localEntries, setLocalEntries] = useState({});
  const [editingInputs, setEditingInputs] = useState({});
  const eventSectionRefs = useRef({});

  const { data: meet, isLoading: isLoadingMeet, isError: isMeetError, error: meetError } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}`).then((res) => res.data),
    queryKey: ["meet", id],
    enabled: !!id && !!token,
  });

  const [relayResults, setRelayResults] = useState({});
  const [relayStatuses, setRelayStatuses] = useState({});
  const [savingRelayId, setSavingRelayId] = useState(null);

  const { data: resultData, isLoading: isLoadingEntries, isError: isEntriesError, error: entriesError, refetch: refetchEntries } = useQuery({
    queryFn: () =>
      makeRequest.get(`/public/meets/${id}/result-entries`, { params: { token } }).then((res) => res.data),
    queryKey: ["publicMeetResultEntries", id, token],
    enabled: !!id && !!token,
  });

  // Soportar respuesta vieja (array) y nueva ({ entries, relayInscriptions })
  const resultEntries = Array.isArray(resultData) ? resultData : resultData?.entries || [];
  const relayFromEntries = Array.isArray(resultData) ? [] : resultData?.relayInscriptions || [];

  // Fallback: si el endpoint no devuelve relay data, buscarla del endpoint público de meets
  const { data: relayFallback } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/relay-inscriptions`).then(r => r.data),
    queryKey: ["meetRelayInscriptionsFallback", id],
    enabled: !!id && relayFromEntries.length === 0,
  });

  const relayInscriptions = relayFromEntries.length > 0 ? relayFromEntries : (relayFallback || []);

  useEffect(() => {
    if (!relayInscriptions?.length) return;
    const initR = {};
    const initS = {};
    relayInscriptions.forEach(r => {
      if (r.status) initS[r.relay_id] = r.status;
      else if (r.result != null) initR[r.relay_id] = formatResultForInput(r.result, "s");
    });
    setRelayResults(prev => { const m = { ...initR }; Object.keys(prev).forEach(k => { if (prev[k] !== undefined && prev[k] !== "") m[k] = prev[k]; }); return m; });
    setRelayStatuses(prev => { const m = { ...initS }; Object.keys(prev).forEach(k => { if (prev[k] !== undefined) m[k] = prev[k]; }); return m; });
  }, [relayInscriptions]);

  const handleSaveRelayResult = async (relayId) => {
    const raw = relayResults[relayId];
    const status = relayStatuses[relayId] || null;
    const resultNum = parseResultInput(raw, "s");
    setSavingRelayId(relayId);
    try {
      await makeRequest.put(`/public/meets/${id}/relay-results/${relayId}`, { result: resultNum, status }, { params: { token } });
      toast.success("Resultado de posta guardado", { theme: "colored" });
      refetchEntries();
      queryClient.invalidateQueries(["meetRelayInscriptionsFallback", id]);
    } catch (err) {
      toast.error("Error al guardar resultado", { theme: "colored" });
    } finally { setSavingRelayId(null); }
  };

  const groupedByEvent = useMemo(() => {
    if (!resultEntries || !Array.isArray(resultEntries) || resultEntries.length === 0) return {};

    const grouped = {};
    resultEntries.forEach((row) => {
      const eventKey = `${row.event_id}_${row.event_gender}_${row.discipline_alias}`;
      if (!grouped[eventKey]) {
        grouped[eventKey] = {
          eventKey,
          event_id: row.event_id,
          discipline_id: row.discipline_id,
          discipline_alias: row.discipline_alias,
          discipline_name: row.discipline_name,
          discipline_unit: row.discipline_unit,
          discipline_is_wind: !!row.discipline_is_wind,
          discipline_is_weight: !!row.discipline_is_weight,
          event_gender: row.event_gender,
          event_time: row.event_time,
          entries: [],
        };
      }
      grouped[eventKey].entries.push(row);
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const ea = grouped[a];
      const eb = grouped[b];
      if (ea.event_gender !== eb.event_gender) return (ea.event_gender || 0) - (eb.event_gender || 0);
      if (ea.event_time !== eb.event_time) return (ea.event_time || "").localeCompare(eb.event_time || "");
      return (ea.discipline_alias || "").localeCompare(eb.discipline_alias || "");
    });
    const out = {};
    sortedKeys.forEach((k) => { out[k] = grouped[k]; });
    return out;
  }, [resultEntries]);

  const disciplineIdsWithWeight = useMemo(() => {
    return [...new Set(
      Object.values(groupedByEvent).filter((g) => g.discipline_is_weight && g.discipline_id).map((g) => g.discipline_id)
    )];
  }, [groupedByEvent]);

  const weightQueries = useQueries({
    queries: disciplineIdsWithWeight.map((disciplineId) => ({
      queryKey: ["publicWeights", disciplineId, token],
      queryFn: () =>
        makeRequest.get(`/public/results/weights/${disciplineId}`, { params: { token } }).then((res) => res.data),
      enabled: !!token && !!disciplineId,
      retry: false,
    })),
  });

  const weightOptionsByDiscipline = useMemo(() => {
    const map = {};
    weightQueries.forEach((q, i) => {
      const disciplineId = disciplineIdsWithWeight[i];
      if (!disciplineId || !q.data) return;
      map[disciplineId] = (q.data || []).map((w) => ({
        value: String(w.id),
        label: w.label || (w.weight >= 1000 ? `${(w.weight / 1000).toFixed(2)} kg` : `${w.weight} g`),
      }));
    });
    return map;
  }, [weightQueries, disciplineIdsWithWeight]);

  const getEntryState = (eventKey, userId, field) => {
    const key = `${eventKey}_${userId}`;
    if (localEntries[key] && localEntries[key][field] !== undefined) return localEntries[key][field];
    return undefined;
  };

  const getEntryValue = (entry, eventKey, field) => {
    const local = getEntryState(eventKey, entry.user_id, field);
    if (local !== undefined) return local;
    if (field === "result") return entry.result != null ? String(entry.result) : "";
    if (field === "wind") return entry.wind != null ? String(entry.wind) : "";
    if (field === "weight") return entry.weight != null ? String(entry.weight) : "";
    if (field === "status") return entry.result_status || "";
    return "";
  };

  const getInputValue = (entry, eventKey, field, unit) => {
    const editingKey = `${eventKey}_${entry.user_id}_${field}`;
    const isEditing = editingInputs[editingKey];
    const rawValue = getEntryValue(entry, eventKey, field);

    if (field === "result") {
      if (isEditing) return rawValue;
      return formatResultForInput(rawValue, unit);
    }
    return rawValue;
  };

  const setEntryValue = (eventKey, userId, field, value) => {
    const key = `${eventKey}_${userId}`;
    setLocalEntries((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  };

  const updateResultsMutation = useMutation({
    mutationFn: async ({ eventId, entries }) => {
      const res = await makeRequest.put(
        `/public/meets/${id}/events/${eventId}/results`,
        { entries },
        { params: { token } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Resultados actualizados", { theme: "colored" });
      queryClient.invalidateQueries(["publicMeetResultEntries", id, token]);
      setLocalEntries({});
    },
    onError: (err) => {
      if (err.response?.status === 401) {
        toast.error("Link inválido o expirado", { theme: "colored" });
        return;
      }
      toast.error(err.response?.data?.message || err.response?.data || "Error al actualizar", { theme: "colored" });
    },
  });

  const handleUpdateEventResults = (eventKey) => {
    const group = groupedByEvent[eventKey];
    if (!group || !group.entries.length) return;

    const entries = group.entries.map((entry) => {
      const resultRaw = getEntryValue(entry, eventKey, "result");
      const wind = getEntryValue(entry, eventKey, "wind");
      const weight = getEntryValue(entry, eventKey, "weight");
      const status = getEntryValue(entry, eventKey, "status");
      const resultNum = parseResultInput(resultRaw, group.discipline_unit);
      return {
        user_id: entry.user_id,
        result: resultNum != null ? resultNum : null,
        wind: wind.trim() ? wind : null,
        weight: weight.trim() ? weight : null,
        status: status || null,
      };
    });

    updateResultsMutation.mutate({ eventId: group.event_id, entries });
  };

  const getGenderLabel = (g) => (g === 1 ? "Hombres" : g === 2 ? "Mujeres" : "Mixto");
  const formatTime = (t) => (t ? String(t).substring(0, 5).replace(":", ".") + "hs" : "");

  if (!token) {
    return (
      <div id="MeetResultsEdit" className="invalidLink">
        <p>Link inválido o expirado</p>
        <button type="button" onClick={() => navigate("/meets")}>Volver a competencias</button>
      </div>
    );
  }

  const isUnauthorized = (isEntriesError && entriesError?.response?.status === 401) || (isMeetError && meetError?.response?.status === 401);
  if (isUnauthorized) {
    return (
      <div id="MeetResultsEdit" className="invalidLink">
        <p>Link inválido o expirado</p>
        <button type="button" onClick={() => navigate("/meets")}>Volver a competencias</button>
      </div>
    );
  }

  if (isLoadingMeet || isLoadingEntries) {
    return (
      <div id="MeetResultsEdit">
        <div className="loadingMessage">Cargando...</div>
      </div>
    );
  }

  return (
    <div id="MeetResultsEdit">
      <nav>
        <button type="button" id="backButton" onClick={() => navigate(`/meet/${id}/results`)}>
          <Icon name="left-arrow" size={24} color={COLORS.black_01} />
        </button>
        <button type="button" id="profileButton" onClick={() => navigate("/")}>
          <Icon name="fam" size={24} color={COLORS.black_01} />
          <p>WEBFAM</p>
        </button>
      </nav>

      <main>
        <section>
          <div id="meetHeader">
            <p id="meetTimeLeft">{meet?.date && dateFullFormatter(meet.date)}</p>
            <div id="meetTitleRow">
              <p id="meetDate">EDITAR RESULTADOS</p>
            </div>
            <p id="meetName">{meet?.name}</p>
          </div>

          {Object.keys(groupedByEvent).length > 0 ? (
            Object.entries(groupedByEvent).map(([eventKey, group]) => (
              <div
                key={eventKey}
                id="eventResults"
                ref={(el) => { if (eventKey) eventSectionRefs.current[eventKey] = el; }}
              >
                <div className="eventResultsHeader">
                  <h2>{getGenderLabel(group.event_gender)} {group.discipline_alias || group.discipline_name}</h2>
                  <p>{formatTime(group.event_time)}</p>
                </div>
                <div className="resultsTableWrap">
                  <table className="resultsTable">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Atleta</th>
                        <th>FDN</th>
                        <th>Club</th>
                        <th>Marca</th>
                        {group.discipline_is_wind && <th>Viento</th>}
                        {group.discipline_is_weight && <th>{/c\/v/i.test(group.discipline_alias || group.discipline_name || "") ? "Valla" : "Peso"}</th>}
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.entries.map((entry, idx) => (
                        <tr key={entry.user_id}>
                          <td>{idx + 1}</td>
                          <td>{entry.user_name}</td>
                          <td>{entry.birth_year ?? ""}</td>
                          <td>{entry.club_alias || "—"}</td>
                          <td>
                            <input
                              type="text"
                              placeholder={group.discipline_unit === "s" ? "Seg o MM.ss.mm" : "Marca"}
                              value={getInputValue(entry, eventKey, "result", group.discipline_unit)}
                              onFocus={() => {
                                setEditingInputs((prev) => ({ ...prev, [`${eventKey}_${entry.user_id}_result`]: true }));
                              }}
                              onChange={(e) => setEntryValue(eventKey, entry.user_id, "result", e.target.value)}
                              onBlur={() => {
                                setEditingInputs((prev) => {
                                  const next = { ...prev };
                                  delete next[`${eventKey}_${entry.user_id}_result`];
                                  return next;
                                });
                              }}
                              disabled={!!getEntryValue(entry, eventKey, "status")}
                            />
                          </td>
                          {group.discipline_is_wind && (
                            <td>
                              <input
                                type="text"
                                placeholder="Viento"
                                value={getEntryValue(entry, eventKey, "wind")}
                                onChange={(e) => setEntryValue(eventKey, entry.user_id, "wind", e.target.value)}
                                disabled={!!getEntryValue(entry, eventKey, "status")}
                              />
                            </td>
                          )}
                          {group.discipline_is_weight && (
                            <td>
                              <Select
                                isClearable
                                placeholder={/c\/v/i.test(group.discipline_alias || group.discipline_name || "") ? "Valla" : "Peso"}
                                isDisabled={!!getEntryValue(entry, eventKey, "status")}
                                options={weightOptionsByDiscipline[group.discipline_id] || []}
                                value={(weightOptionsByDiscipline[group.discipline_id] || []).find(
                                  (opt) => opt.value === getEntryValue(entry, eventKey, "weight")
                                ) ?? null}
                                onChange={(opt) => setEntryValue(eventKey, entry.user_id, "weight", opt ? opt.value : "")}
                                styles={weightSelectStyles}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                              />
                            </td>
                          )}
                          <td>
                            <select
                              value={getEntryValue(entry, eventKey, "status")}
                              onChange={(e) => setEntryValue(eventKey, entry.user_id, "status", e.target.value)}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  className="updateResultsButton"
                  onClick={() => handleUpdateEventResults(eventKey)}
                  disabled={updateResultsMutation.isPending}
                >
                  Actualizar Resultados
                </button>
                <div className="separator" />
              </div>
            ))
          ) : (resultData !== undefined && !relayInscriptions?.length) ? (
            <p className="emptyMessage">No hay inscriptos en esta competencia</p>
          ) : null}

          {relayInscriptions?.length > 0 && (() => {
            const grouped = {};
            relayInscriptions.forEach(relay => {
              const key = relay.event;
              if (!grouped[key]) {
                grouped[key] = {
                  event_id: relay.event,
                  discipline_alias: relay.discipline_alias,
                  gender_name: relay.gender_name,
                  event_time: relay.event_time,
                  teams: []
                };
              }
              grouped[key].teams.push(relay);
            });

            return Object.values(grouped).map(group => (
              <div key={group.event_id} id="eventResults">
                <div className="eventResultsHeader">
                  <h2>{group.gender_name} {group.discipline_alias}</h2>
                  <p>{formatTime(group.event_time)}</p>
                </div>
                <div className="resultsTableWrap">
                  <table className="resultsTable">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Club</th>
                        <th>Atletas</th>
                        <th>Marca</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.teams.map((relay, idx) => {
                        const hasStatus = !!relayStatuses[relay.relay_id];
                        return (
                          <tr key={relay.relay_id}>
                            <td>{idx + 1}</td>
                            <td>{relay.club_alias}</td>
                            <td style={{ fontSize: "13px", maxWidth: "250px", whiteSpace: "normal" }}>{relay.athletes?.map(a => a.athlete_name).join(", ")}</td>
                            <td>
                              <input
                                type="text"
                                placeholder="Seg o MM.ss.mm"
                                value={relayResults[relay.relay_id] ?? ""}
                                onChange={(e) => setRelayResults(prev => ({ ...prev, [relay.relay_id]: e.target.value }))}
                                disabled={hasStatus}
                              />
                            </td>
                            <td>
                              <select
                                value={relayStatuses[relay.relay_id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRelayStatuses(prev => ({ ...prev, [relay.relay_id]: val }));
                                  if (val) setRelayResults(prev => ({ ...prev, [relay.relay_id]: "" }));
                                }}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  className="updateResultsButton"
                  onClick={() => { group.teams.forEach(relay => handleSaveRelayResult(relay.relay_id)); }}
                  disabled={savingRelayId != null}
                >
                  Actualizar Resultados
                </button>
                <div className="separator" />
              </div>
            ));
          })()}
        </section>
      </main>
    </div>
  );
}

export default Transition(MeetResultsEdit);
