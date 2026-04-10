import { dateFullFormatter, timeLeft, timeGetter, shortDate, dateOnlyFormatter } from "../constants/timeGetter";

// Misma lógica que Meet.jsx: inscripciones abiertas solo si meet.available es futura
const isInscriptionOpen = (available) => {
  if (!available) return false;
  const availableDate = new Date(available);
  const now = new Date();
  return availableDate > now;
};

// Convierte time (HH:MM, HH:MM:SS o ISO) a minutos desde medianoche para ordenar
const parseTimeToMinutes = (time) => {
  if (time == null || time === "") return 0;
  const s = String(time).trim();
  const part = s.includes("T") ? s.split("T")[1] : s;
  const [h, m] = (part || "").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const sortEventsByTime = (events) => {
  if (!events || !Array.isArray(events)) return [];
  return [...events].sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
};
import { profileImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import { resultGetter } from "../constants/resultGetter";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthClub } from "../contexts/AuthContextClub";
import { formatPrice } from "../constants/priceFormatter";
import "material-react-toastify/dist/ReactToastify.css";
import EventItem from "../components/meets/EventItem";
import { useQuery } from "@tanstack/react-query";
import { toast } from "material-react-toastify";
import { makeRequest } from "../config/axios";
import { COLORS } from "../constants/theme";
import { useEffect, useState } from "react";
import Transition from "../Transition";
import Icon from "../constants/Icon";

function ClubMeet() {
  useEffect(() => {import("./styles/clubMeet.scss")}, []);
  const { authState } = useAuthClub();
  const navigate = useNavigate();
  const { id } = useParams();

  const [selectedAthletes, setSelectedAthletes] = useState({}); // { athleteId: [eventIds] }
  const [currentAthleteId, setCurrentAthleteId] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInsufficientFundsModal, setShowInsufficientFundsModal] = useState(false);
  const [clubFunds, setClubFunds] = useState(null);

  // Relay / Posta states
  const [activeTab, setActiveTab] = useState('individual');
  const [composingRelayEvent, setComposingRelayEvent] = useState(null);
  const [selectedRelayAthletes, setSelectedRelayAthletes] = useState([]);
  const [isRelayProcessing, setIsRelayProcessing] = useState(false);
  const [relaySearchTerm, setRelaySearchTerm] = useState("");
  const [showRelayCheckout, setShowRelayCheckout] = useState(false);
  const [relayCheckoutData, setRelayCheckoutData] = useState(null);

  const { data: meet, isLoading: isLoadingMeet } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}`).then((res) => res.data),
    queryKey: ["meet", id],
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/events`).then((res) => res.data),
    queryKey: ["events", id],
  });

  const { data: clubAthletes, isLoading: isLoadingAthletes } = useQuery({
    queryFn: () => makeRequest.get("/clubs/own/athletes", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubAthletes"],
    enabled: !!authState?.token,
  });

  // Obtener inscripciones existentes de los atletas del club en este meet
  const { data: existingInscriptions } = useQuery({
    queryFn: () => makeRequest.get(`/clubs/own/athletes/inscriptions/${id}`, {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["existingInscriptions", id],
    enabled: !!authState?.token,
  });

  // Obtener TODAS las inscripciones del torneo (para "Ver X Inscripciones")
  const { data: allInscriptions } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/inscriptions`).then((res) => res.data),
    queryKey: ["allInscriptions", id],
    enabled: !!authState?.authenticated,
  });

  // Obtener fondos del club
  const { data: fundsData } = useQuery({
    queryFn: () => makeRequest.get("/clubs/own/funds", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubFunds"],
    enabled: !!authState?.token,
  });

  useEffect(() => {
    if (fundsData?.funds !== undefined) {
      setClubFunds(fundsData.funds);
    }
  }, [fundsData]);

  // fund_visible es null cuando es visible, o un PIN cuando está oculto
  const isFundVisible = fundsData?.fund_visible === null;

  // Obtener eventos disponibles para el atleta seleccionado
  const { data: availableEvents } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/events/available/athlete/${currentAthleteId}`, {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["availableEvents", id, currentAthleteId],
    enabled: !!currentAthleteId && !!authState?.token,
  });

  // Relay events disponibles para el club
  const { data: relayEvents, refetch: refetchRelayEvents } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/relay-events`, {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["relayEvents", id],
    enabled: !!authState?.token,
  });

  // Relay inscriptions existentes del club
  const { data: clubRelayInscriptions, refetch: refetchRelayInscriptions } = useQuery({
    queryFn: () => makeRequest.get(`/clubs/own/relay-inscriptions/${id}`, {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubRelayInscriptions", id],
    enabled: !!authState?.token,
  });

  // Filtrar solo atletas habilitados
  // 1. Certificado médico aprobado (cert_status == 2)
  // 2. Para atletas con federation = 1: tener pago aprobado este año (revalida, afiliación o pase de club)
  const enabledAthletes = clubAthletes?.filter(
    athlete => parseInt(athlete.cert_status) === 2 &&
               (parseInt(athlete.federation) !== 1 || parseInt(athlete.has_valid_payment) === 1)
  ) || [];

  // Filtrar atletas por término de búsqueda (nombre o DNI)
  const filteredAthletes = enabledAthletes.filter(athlete => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return athlete.name.toLowerCase().includes(searchLower) ||
           String(athlete.dni || "").includes(searchLower);
  });

  if(!meet || !events) return <div>Cargando...</div>

  const handleMapClick = () => { 
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

  const handleAthleteSelect = (athleteId) => {
    setCurrentAthleteId(athleteId);
  };

  const handleEventToggle = (eventId, price, discipline, time) => {
    if (!currentAthleteId) {
      toast.error("Primero selecciona un atleta", { theme: "colored" });
      return;
    }

    // Verificar si ya está inscripto
    const isAlreadyInscribed = existingInscriptions?.some(
      ins => ins.athlete_id === currentAthleteId && ins.event_id === eventId
    );

    if (isAlreadyInscribed) {
      toast.error("Este atleta ya está inscripto en esta prueba", { theme: "colored" });
      return;
    }

    setSelectedAthletes(prev => {
      const athleteEvents = prev[currentAthleteId] || [];
      const eventExists = athleteEvents.find(e => e.eventId === eventId);
      
      if (eventExists) {
        // Remover evento
        const newEvents = athleteEvents.filter(e => e.eventId !== eventId);
        if (newEvents.length === 0) {
          const { [currentAthleteId]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [currentAthleteId]: newEvents };
      } else {
        // Agregar evento con disciplina y hora
        return {
          ...prev,
          [currentAthleteId]: [...athleteEvents, { eventId, price, discipline, time }]
        };
      }
    });
  };

  const isEventSelected = (eventId) => {
    if (!currentAthleteId) return false;
    const athleteEvents = selectedAthletes[currentAthleteId] || [];
    return athleteEvents.some(e => e.eventId === eventId);
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(selectedAthletes).forEach(events => {
      events.forEach(event => {
        total += parseFloat(event.price);
      });
    });
    return total;
  };

  const getTotalInscriptions = () => {
    let count = 0;
    Object.values(selectedAthletes).forEach(events => {
      count += events.length;
    });
    return count;
  };

  const handleCheckout = () => {
    if (!isInscriptionOpen(meet.available)) {
      toast.error("Inscripciones cerradas para esta competencia", { theme: "colored" });
      return;
    }
    const totalInscriptions = getTotalInscriptions();
    if (totalInscriptions === 0) {
      toast.error("Debes seleccionar al menos una inscripción", { theme: "colored" });
      return;
    }
    setShowCheckout(true);
  };

  const handlePayment = async (forceMP = false) => {
    if (!isInscriptionOpen(meet.available)) {
      toast.error("Inscripciones cerradas para esta competencia", { theme: "colored" });
      return;
    }
    setIsProcessing(true);
    try {
      // Crear estructura de datos para el pago múltiple
      const inscriptionsData = [];
      
      Object.entries(selectedAthletes).forEach(([athleteId, events]) => {
        events.forEach(event => {
          inscriptionsData.push({
            athlete_id: parseInt(athleteId),
            event_id: event.eventId,
            price: parseFloat(event.price) || 0
          });
        });
      });

      const totalAmount = calculateTotal();
      
      console.log('📤 Datos del pago a enviar:', {
        club_id: authState.club.id,
        meet_id: parseInt(id),
        inscriptions: inscriptionsData,
        total_amount: totalAmount,
        force_mp_payment: forceMP
      });

      const paymentData = {
        club_id: authState.club.id,
        meet_id: parseInt(id),
        inscriptions: inscriptionsData,
        total_amount: parseFloat(totalAmount) || 0,
        force_mp_payment: forceMP
      };

      const response = await makeRequest.post('/payments/create-multiple', paymentData, {
        headers: { Authorization: authState.token }
      });

      if (response.status === 200) {
        const { init_point, paid_with_funds, funds_used, message } = response.data;
        
        // Si se pagó completamente con fondos, no hay init_point
        if (paid_with_funds) {
          toast.success(message || `Pago realizado exitosamente con fondos del club ($${formatPrice(funds_used)})`, { theme: "colored" });
          // Recargar datos para actualizar la lista de atletas
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        }
        
        // Si hay init_point, redirigir a MercadoPago
        if (init_point) {
          // Guardar el meetId en sessionStorage para usarlo después del pago
          sessionStorage.setItem('pendingClubMeetId', id);
          window.location.href = init_point;
          return;
        } else {
          throw new Error('No se recibió el init_point de MercadoPago');
        }
      }
    } catch (error) {
      console.error('Error al crear pago:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Si el error es de fondos insuficientes, mostrar modal
      if (error.response?.status === 400 && error.response?.data?.insufficient_funds) {
        setIsProcessing(false);
        setShowInsufficientFundsModal(true);
        return;
      }
      
      // Mostrar mensaje de error más específico
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Error al procesar el pago";
      toast.error(errorMessage, { theme: "colored" });
      setIsProcessing(false);
    }
  };

  const handlePayWithMP = () => {
    setShowInsufficientFundsModal(false);
    handlePayment(true); // Forzar pago con MP
  };

  // --- Relay helpers ---
  const getRelaySize = (alias) => {
    const match = alias?.match(/^(\d+)x/i);
    return match ? parseInt(match[1]) : 4;
  };

  const handleToggleRelayAthlete = (athleteId) => {
    setSelectedRelayAthletes(prev => {
      if (prev.includes(athleteId)) return prev.filter(id => id !== athleteId);
      const maxSize = composingRelayEvent ? getRelaySize(composingRelayEvent.discipline) : 4;
      if (prev.length >= maxSize) return prev;
      return [...prev, athleteId];
    });
    setRelaySearchTerm("");
  };

  const handleConfirmRelayTeam = () => {
    if (!composingRelayEvent) return;
    const requiredSize = getRelaySize(composingRelayEvent.discipline);
    if (selectedRelayAthletes.length !== requiredSize) {
      toast.error(`Selecciona exactamente ${requiredSize} atletas`, { theme: "colored" });
      return;
    }
    // Obtener precio de la posta (viene del backend en relayEvents, o usar 0)
    const price = composingRelayEvent.price ?? 0;
    const athleteDetails = selectedRelayAthletes.map(id => enabledAthletes.find(a => a.id === id)).filter(Boolean);
    setRelayCheckoutData({ event: composingRelayEvent, athleteIds: selectedRelayAthletes, athletes: athleteDetails, price });
    setComposingRelayEvent(null);
    setShowRelayCheckout(true);
  };

  const handleRelayPayment = async (forceMP = false) => {
    if (!relayCheckoutData) return;
    setIsRelayProcessing(true);
    try {
      const response = await makeRequest.post('/clubs/own/relay-inscriptions', {
        event_id: relayCheckoutData.event.id,
        athlete_ids: relayCheckoutData.athleteIds,
        force_mp_payment: forceMP,
      }, { headers: { Authorization: authState.token } });

      if (response.data.init_point) {
        sessionStorage.setItem('pendingClubMeetId', id);
        window.location.href = response.data.init_point;
        return;
      }

      if (response.data.paid_with_funds || response.status === 201) {
        toast.success("Posta inscripta exitosamente", { theme: "colored" });
        setShowRelayCheckout(false);
        setRelayCheckoutData(null);
        setSelectedRelayAthletes([]);
        refetchRelayEvents();
        refetchRelayInscriptions();
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.insufficient_funds) {
        toast.error("Fondos insuficientes. Pagá con Mercado Pago.", { theme: "colored" });
      } else {
        const msg = typeof err.response?.data === 'string' ? err.response.data : "Error al inscribir posta";
        toast.error(msg, { theme: "colored" });
      }
    } finally {
      setIsRelayProcessing(false);
    }
  };

  const handleDeleteRelay = async (relayId) => {
    if (!window.confirm("¿Eliminar esta posta?")) return;
    try {
      await makeRequest.delete(`/clubs/own/relay-inscriptions/${relayId}`, {
        headers: { Authorization: authState.token }
      });
      toast.success("Posta eliminada", { theme: "colored" });
      refetchRelayEvents();
      refetchRelayInscriptions();
    } catch (err) {
      toast.error("Error al eliminar posta", { theme: "colored" });
    }
  };

  const currentAthlete = enabledAthletes.find(a => a.id === currentAthleteId);
  
  // Obtener inscripciones existentes del atleta actual
  const currentAthleteInscriptions = existingInscriptions?.filter(
    ins => ins.athlete_id === currentAthleteId
  ) || [];
  
  // Filtrar eventos que ya están inscriptos y ordenar por horario
  const availableEventsFiltered = availableEvents?.filter(event => {
    return !currentAthleteInscriptions.some(ins => ins.event_id === event.id);
  }) || [];
  const availableEventsByTime = sortEventsByTime(availableEventsFiltered);

  // Función para obtener inscripciones de un atleta
  const getAthleteInscriptions = (athleteId) => {
    return existingInscriptions?.filter(ins => ins.athlete_id === athleteId) || [];
  };

  return (
    <div id="ClubMeet">
      <nav>
        <button id="backButton" onClick={() => navigate("/club/meets")}>
          <Icon name="left-arrow" size={24} color={COLORS.black_01} />
        </button>

        <button id="profileButton" onClick={() => navigate("/club")}>
          <Icon name="users-group" size={24} color={COLORS.black_01} />
          <p>{authState?.club?.alias || "Club"}</p>
        </button>
      </nav>

      <main>
        <section>
          <div id="meetHeader">
            <p id="meetTimeLeft">{dateOnlyFormatter(meet.date)}</p>
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
                  <p>Descargar Programa & Horarios</p>
                </button>
              )}
              <button onClick={() => navigate(`/inscriptions/${id}`)}>
                <p>Ver {meet.athletes} Inscripciones</p>
              </button>
              <button onClick={() => navigate(`/meet/${id}/results`)}>
                <p>Ver Resultados</p>
              </button>
              {authState.authenticated && (
                <button onClick={() => navigate(`/club/meet/${id}/inscriptions`)}>
                  <p>Ver MIS Inscriptos</p>
                </button>
              )}
              <p className={isInscriptionOpen(meet.available) ? "tag open" : "tag closed"}>
                {isInscriptionOpen(meet.available) ? `Inscripciones hasta ${shortDate(meet.available)}` : "Inscripciones cerradas"}
              </p>
            </div>
          </div>

          {authState.authenticated && isInscriptionOpen(meet.available) && (
          <div id="athletesSelection">
            <h4>Selecciona Atletas <strong style={{ color: COLORS.purple_01 }}>HABILITADOS</strong></h4>
            
            <div id="searchContainer">
              <Icon name="search" size={20} color={COLORS.black_01} />
              <input
                type="text"
                id="athleteSearch"
                placeholder="Buscar por nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {isLoadingAthletes ? (
              <p>Cargando atletas...</p>
            ) : filteredAthletes.length > 0 ? (
              <div id="athletesList">
                {filteredAthletes.map(athlete => {
                  const athleteInscriptions = selectedAthletes[athlete.id]?.length || 0;
                  const isSelected = currentAthleteId === athlete.id;
                  const existingInscriptionsForAthlete = getAthleteInscriptions(athlete.id);
                  
                  return (
                    <button key={athlete.id} className={`athleteCard ${isSelected ? 'selected' : ''}`} onClick={() => handleAthleteSelect(athlete.id)}>
                      <img src={profileImageGetter(athlete.image)} alt={athlete.name} />
                      <div className="athleteInfo">
                        <p className="athleteName">{athlete.name}</p>
                        <p className="athleteCategory">{categoryGetter(athlete.born)}</p>
                        {existingInscriptionsForAthlete.length > 0 && <p className="athleteInscriptions">{existingInscriptionsForAthlete.length} prueba{existingInscriptionsForAthlete.length > 1 ? 's' : ''} inscripta{existingInscriptionsForAthlete.length > 1 ? 's' : ''}</p>}
                      </div>
                      {athleteInscriptions > 0 && <div className="inscriptionBadge">Inscripto: {athleteInscriptions}</div>}
                    </button>
                  );
                })}
              </div>
            ) : searchTerm.trim() ? (
              <p className="emptyMessage">No se encontraron atletas con el nombre "{searchTerm}"</p>
            ) : (
              <p className="emptyMessage">No tienes atletas habilitados. Los atletas deben tener el certificado médico y recibo aprobados.</p>
            )}
          </div>
          )}
        </section>

        <section>
          <div id="headerSpacer"/>

          {authState.authenticated && isInscriptionOpen(meet.available) && relayEvents?.length > 0 && (
            <div id="inscriptionTabs">
              <button className={activeTab === 'individual' ? 'active' : ''} onClick={() => setActiveTab('individual')}>Individuales</button>
              <button className={activeTab === 'relay' ? 'active' : ''} onClick={() => setActiveTab('relay')}>Relevos</button>
            </div>
          )}

          {activeTab === 'relay' && isInscriptionOpen(meet.available) && (
            <div id="relaySection">
              <h4>Postas / Relevos</h4>

              {/* Relay inscriptions existentes */}
              {clubRelayInscriptions?.length > 0 && (
                <div id="existingRelays">
                  <p className="relaySubtitle">Tus postas inscriptas</p>
                  {clubRelayInscriptions.map(relay => (
                    <div key={relay.id} className="relayTeamCard inscribed">
                      <div className="relayTeamInfo">
                        <p className="relayDiscipline">{relay.discipline}</p>
                        <p className="relayGender">{relay.gender_name}</p>
                        <div className="relayAthletes">
                          {relay.athletes?.map(a => (
                            <span key={a.athlete_id} className="relayAthleteName">{a.athlete_name}</span>
                          ))}
                        </div>
                      </div>
                      <button className="relayDeleteButton" onClick={() => handleDeleteRelay(relay.id)}>
                        <Icon name="trash" size={18} color={COLORS.red_01} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Relay events disponibles */}
              {relayEvents?.filter(e => !e.inscripted).length > 0 && (
                <div id="availableRelays">
                  <p className="relaySubtitle">Pruebas disponibles</p>
                  {relayEvents.filter(e => !e.inscripted).map(event => (
                    <div key={event.id} className="relayEventCard">
                      <div className="relayEventInfo">
                        <p className="relayEventTime">{timeGetter(event.time)}</p>
                        <p className="relayEventDiscipline">{event.discipline}</p>
                        <p className="relayEventGender">{event.gender_name}</p>
                        {event.categories && <p className="relayEventCategories">{event.categories}</p>}
                      </div>
                      <button className="relayComposeButton" onClick={() => { setComposingRelayEvent(event); setSelectedRelayAthletes([]); setRelaySearchTerm(""); }}>
                        Componer equipo ({getRelaySize(event.discipline)})
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {relayEvents?.filter(e => !e.inscripted).length === 0 && !clubRelayInscriptions?.length && (
                <p className="emptyMessage">No hay pruebas de relevos disponibles</p>
              )}
            </div>
          )}

          {/* Modal composición de equipo */}
          {composingRelayEvent && (
            <div id="relayComposeModal" onClick={() => setComposingRelayEvent(null)}>
              <div className="relayComposeContent" onClick={(e) => e.stopPropagation()}>
                <div className="relayComposeHeader">
                  <h3>{composingRelayEvent.discipline} - {composingRelayEvent.gender_name}</h3>
                  <button onClick={() => setComposingRelayEvent(null)}>✕</button>
                </div>
                <p className="relayComposeSubtitle">Selecciona {getRelaySize(composingRelayEvent.discipline)} atletas</p>
                {selectedRelayAthletes.length > 0 && (
                  <div className="relaySelectedList">
                    {selectedRelayAthletes.map(id => {
                      const a = enabledAthletes.find(at => at.id === id);
                      if (!a) return null;
                      return (
                        <div key={id} className="relaySelectedChip">
                          <span>{a.name}</span>
                          <button onClick={() => handleToggleRelayAthlete(id)}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="relaySearchContainer">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o DNI..."
                    value={relaySearchTerm}
                    onChange={(e) => setRelaySearchTerm(e.target.value)}
                  />
                </div>
                <div className="relayAthletesList">
                  {enabledAthletes.filter(a => {
                    if (!relaySearchTerm.trim()) return true;
                    const s = relaySearchTerm.toLowerCase().trim();
                    return a.name.toLowerCase().includes(s) || String(a.dni || "").includes(s);
                  }).map(athlete => {
                    const isSelected = selectedRelayAthletes.includes(athlete.id);
                    const maxReached = selectedRelayAthletes.length >= getRelaySize(composingRelayEvent.discipline);
                    return (
                      <button
                        key={athlete.id}
                        className={`relayAthleteOption ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleRelayAthlete(athlete.id)}
                        disabled={!isSelected && maxReached}
                      >
                        <img src={profileImageGetter(athlete.image)} alt={athlete.name} />
                        <span>{athlete.name}</span>
                        {isSelected && <Icon name="check" size={18} color={COLORS.white_01} />}
                      </button>
                    );
                  })}
                </div>
                <div className="relayComposeFooter">
                  <p>{selectedRelayAthletes.length} / {getRelaySize(composingRelayEvent.discipline)} seleccionados</p>
                  <button
                    className="relayConfirmButton"
                    onClick={handleConfirmRelayTeam}
                    disabled={selectedRelayAthletes.length !== getRelaySize(composingRelayEvent.discipline)}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'individual' && currentAthlete && isInscriptionOpen(meet.available) && (
            <div id="eventsSelection">
              <div id="athleteHeaderInfo">
                <div>
                  <h4>Pruebas para {currentAthlete.name}</h4>
                  <p className="categoryInfo">{categoryGetter(currentAthlete.born)}</p>
                </div>
                {currentAthleteInscriptions.length > 0 && (
                  <div id="existingInscriptions">
                    <p className="inscriptionsTitle">Ya inscripto en:</p>
                    <div className="inscriptionsList">
                      {currentAthleteInscriptions.map(ins => (
                        <div key={ins.event_id} className="inscriptionTag">
                          <p>{timeGetter(ins.time)}</p>
                          <p>- {ins.discipline}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {availableEventsByTime && availableEventsByTime.length > 0 ? (
                <div id="eventsList">
                  {availableEventsByTime.map(event => {
                    const isInscribed = currentAthleteInscriptions.some(ins => ins.event_id === event.id);
                    const isSelected = isEventSelected(event.id);
                    
                    return (
                      <div key={event.id} className={`eventCardWrapper ${isSelected ? 'selected' : ''} ${isInscribed ? 'inscribed' : ''}`} >
                        <button className="eventCard" onClick={() => handleEventToggle(event.id, event.price, event.discipline, event.time)} disabled={isInscribed} >
                          <div className="eventMainInfo">
                            <div className="eventHeader">
                              <div className="eventHeaderInfo">
                                <div className="eventTimeBadge">
                                  <Icon name="clock" size={24} color={isSelected || isInscribed ? COLORS.white_01 : COLORS.black_01} />
                                  <span className="eventTime">{timeGetter(event.time)}</span>
                                </div>
                                <div className="eventTimeBadge">
                                  <span className="eventName">{event.discipline}</span>
                                </div>
                              </div>
                              {isSelected && !isInscribed && <div className="statusBadge selected">Seleccionado</div>}
                              {isInscribed && <div className="statusBadge inscribed"><Icon name="check" size={14} color={COLORS.white_01} />Inscripto</div>}
                            </div>

                            <div className="eventContent">
                              <div className="eventDetails">
                                <div className="eventMeta">
                                  {event.best_mark ?
                                    <div className="eventMark">
                                      <span>Mejor marca <strong>{resultGetter(event.best_mark, event.unit)}</strong></span>
                                    </div>
                                  :
                                    <div className="eventMark">
                                      <span>Sin marca previa</span>
                                    </div>
                                  }
                                </div>
                              </div>

                              <div className="eventPricing">
                                <div className="eventPrice">
                                  <span className="priceAmount">${formatPrice(event.price)}</span>
                                  <span className="priceLabel">ARS</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {!isInscribed &&
                            <div className="eventAction">
                              <div className={`actionButton ${isSelected ? 'selected' : 'default'}`}>
                                <Icon name={isSelected ? "check" : "plus"} size={isSelected ? 18 : 24} color={isSelected ? COLORS.white_01 : COLORS.black_01} />
                        </div>
                        </div>
                          }
                      </button>
                      </div>
                    );
                  })}
                </div>
              ) : currentAthleteInscriptions.length > 0 ? (
                <p className="emptyMessage">Este atleta ya está inscripto en todas las pruebas disponibles</p>
              ) : (
                <p className="emptyMessage">No hay pruebas disponibles para este atleta</p>
              )}
            </div>
          )}

          {activeTab === 'individual' && (!currentAthlete || !isInscriptionOpen(meet.available)) && (
            <div id="meetEvents">
              <h4>Horarios de Pruebas</h4>

              {events?.male.length > 0 && (
                <div className="meetEventsContainer">
                  <p className="meetEventsTitle">Hombres</p>
                  {sortEventsByTime(events.male).map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                </div>
              )}

              {events?.female.length > 0 && (
                <div className="meetEventsContainer">
                  <p className="meetEventsTitle">Mujeres</p>
                  {sortEventsByTime(events.female).map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                </div>
              )}

              {events?.mixed.length > 0 && (
                <div className="meetEventsContainer">
                  <p className="meetEventsTitle">Mixto</p>
                  {sortEventsByTime(events.mixed).map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          {isInscriptionOpen(meet.available) && getTotalInscriptions() > 0 && (
            <div id="checkoutButton">
              <button onClick={handleCheckout}>
                <p>Ver Resumen, {getTotalInscriptions()} Inscripciones</p>
                <p className="totalAmount">${formatPrice(calculateTotal())}</p>
              </button>
            </div>
          )}
        </section>
      </main>

          {/* Modal de Checkout */}
      {showCheckout && (
        <div id="checkoutModal" onClick={() => setShowCheckout(false)}>
          <div id="checkoutContent" onClick={(e) => e.stopPropagation()}>
            <div id="checkoutHeader">
              <h3>Resumen de Inscripciones</h3>
              <button onClick={() => setShowCheckout(false)}>✕</button>
            </div>
            
            <div id="checkoutBody">
              {Object.entries(selectedAthletes).map(([athleteId, events]) => {
                const athlete = enabledAthletes.find(a => a.id === parseInt(athleteId));
                if (!athlete) return null;
                
                return (
                  <div key={athleteId} className="checkoutAthlete">
                    <div className="athleteHeader">
                      <img src={profileImageGetter(athlete.image)} alt={athlete.name} />
                      <div>
                        <p className="athleteName">{athlete.name}</p>
                        <p className="athleteCategory">{categoryGetter(athlete.born)}</p>
                      </div>
                    </div>
                    <div className="athleteEvents">
                      {events.map(event => {
                        return (
                          <div key={event.eventId} className="checkoutEvent">
                            <div>
                              {event.time && <p className="eventTime">{timeGetter(event.time)}</p>}
                              <p>- {event.discipline || 'Evento'}</p>
                            </div>
                            <p className="eventPrice">${formatPrice(event.price)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div id="checkoutFooter">
            <div id="checkoutTotal">
                <p>TOTAL A PAGAR</p>
              <p className="totalAmount">${formatPrice(calculateTotal())}</p>
            </div>

              <div id="paymentOptions">
                <div className="paymentButtons">

                  <button className="paymentOption mercadoPago" onClick={() => handlePayment(true)} disabled={isProcessing} >
                    <div className="paymentInfo">
                      <span className="paymentTitle">{isProcessing ? "Procesando..." : "Mercado Pago"}</span>
                      <span className="paymentSubtitle">{isProcessing ? "Redirigiendo..." : "Tarjeta de crédito/débito"}</span>
                    </div>
                  </button>

                  <button className="paymentOption clubFunds" onClick={() => handlePayment(false)} disabled={isProcessing} >
                    <div className="paymentInfo">
                      <span className="paymentTitle">{isProcessing ? "Procesando..." : "Fondos del Club"}</span>
                      {isFundVisible && (
                        <span className="paymentSubtitle">{isProcessing ? "Verificando fondos..." : `Disponible: $${formatPrice(clubFunds || 0)}`}</span>
                      )}
                      {!isFundVisible && (
                        <span className="paymentSubtitle">{isProcessing ? "Verificando fondos..." : "Usar fondos del club"}</span>
                      )}
                    </div>
              </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fondos Insuficientes */}
      {showInsufficientFundsModal && (
        <div id="checkoutModal" onClick={() => setShowInsufficientFundsModal(false)}>
          <div id="checkoutContent" onClick={(e) => e.stopPropagation()}>
            <div id="checkoutHeader">
              <h3>Fondos Insuficientes</h3>
              <button onClick={() => setShowInsufficientFundsModal(false)}>✕</button>
            </div>
            
            <div id="checkoutBody">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>No hay fondos suficientes para realizar este pago.</p>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>Fondos disponibles: ${formatPrice(clubFunds || 0)}</p>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>Total a pagar: ${formatPrice(calculateTotal())}</p>
                <p style={{ fontSize: '16px', color: '#666' }}>Elige una opción para continuar:</p>
              </div>
            </div>

            <div id="checkoutFooter" style={{ flexDirection: 'column', gap: '10px' }}>
              <button id="payButton" onClick={handlePayWithMP} disabled={isProcessing} style={{ width: '100%' }}>{isProcessing ? "Procesando..." : "PAGAR TODO CON MERCADO PAGO"}</button>
              <button onClick={() => setShowInsufficientFundsModal(false)} disabled={isProcessing} style={{ width: '100%', backgroundColor: '#ccc', color: '#000', border: 'none', padding: '12px', fontSize: '16px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Checkout de Posta */}
      {showRelayCheckout && relayCheckoutData && (
        <div id="checkoutModal" onClick={() => { setShowRelayCheckout(false); setRelayCheckoutData(null); }}>
          <div id="checkoutContent" onClick={(e) => e.stopPropagation()}>
            <div id="checkoutHeader">
              <h3>Resumen de Posta</h3>
              <button onClick={() => { setShowRelayCheckout(false); setRelayCheckoutData(null); }}>✕</button>
            </div>

            <div id="checkoutBody">
              <div className="checkoutAthlete">
                <div className="athleteHeader">
                  <div>
                    <p className="athleteName">{relayCheckoutData.event.discipline}</p>
                    <p className="athleteCategory">{relayCheckoutData.event.gender_name}</p>
                  </div>
                </div>
                <div className="athleteEvents">
                  {relayCheckoutData.athletes.map(athlete => (
                    <div key={athlete.id} className="checkoutEvent">
                      <div>
                        <p>{athlete.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="checkoutFooter">
              <div id="checkoutTotal">
                <p>TOTAL A PAGAR</p>
                <p className="totalAmount">${formatPrice(relayCheckoutData.price)}</p>
              </div>

              <div id="paymentOptions">
                <div className="paymentButtons">
                  <button className="paymentOption mercadoPago" onClick={() => handleRelayPayment(true)} disabled={isRelayProcessing}>
                    <div className="paymentInfo">
                      <span className="paymentTitle">{isRelayProcessing ? "Procesando..." : "Mercado Pago"}</span>
                      <span className="paymentSubtitle">{isRelayProcessing ? "Redirigiendo..." : "Tarjeta de crédito/débito"}</span>
                    </div>
                  </button>

                  <button className="paymentOption clubFunds" onClick={() => handleRelayPayment(false)} disabled={isRelayProcessing}>
                    <div className="paymentInfo">
                      <span className="paymentTitle">{isRelayProcessing ? "Procesando..." : "Fondos del Club"}</span>
                      {isFundVisible && (
                        <span className="paymentSubtitle">{isRelayProcessing ? "Verificando fondos..." : `Disponible: $${formatPrice(clubFunds || 0)}`}</span>
                      )}
                      {!isFundVisible && (
                        <span className="paymentSubtitle">{isRelayProcessing ? "Verificando fondos..." : "Usar fondos del club"}</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Transition(ClubMeet);

