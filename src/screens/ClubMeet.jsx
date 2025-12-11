import { dateFullFormatter, timeLeft, timeGetter } from "../constants/timeGetter";
import { useNavigate, useParams } from "react-router-dom";
import "material-react-toastify/dist/ReactToastify.css";
import EventItem from "../components/meets/EventItem";
import { useAuthClub } from "../contexts/AuthContextClub";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import { COLORS } from "../constants/theme";
import { profileImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import { formatPrice } from "../constants/priceFormatter";
import { toast } from "material-react-toastify";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useEffect, useState } from "react";

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

  // Obtener eventos disponibles para el atleta seleccionado
  const { data: availableEvents } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${id}/events/available/athlete/${currentAthleteId}`, {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["availableEvents", id, currentAthleteId],
    enabled: !!currentAthleteId && !!authState?.token,
  });

  // Filtrar solo atletas habilitados (cert_status === 2 && receipt_status === 2)
  const enabledAthletes = clubAthletes?.filter(
    athlete => athlete.cert_status === 2 && athlete.receipt_status === 2
  ) || [];

  // Filtrar atletas por término de búsqueda
  const filteredAthletes = enabledAthletes.filter(athlete => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    return athlete.name.toLowerCase().includes(searchLower);
  });

  if(!meet || !events) return <div>Cargando...</div>

  const handleMapClick = () => { 
    const address = encodeURIComponent(meet.place_address || meet.place_name);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(url, "_blank");
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
    const totalInscriptions = getTotalInscriptions();
    if (totalInscriptions === 0) {
      toast.error("Debes seleccionar al menos una inscripción", { theme: "colored" });
      return;
    }
    setShowCheckout(true);
  };

  const handlePayment = async (forceMP = false) => {
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

  const currentAthlete = enabledAthletes.find(a => a.id === currentAthleteId);
  
  // Obtener inscripciones existentes del atleta actual
  const currentAthleteInscriptions = existingInscriptions?.filter(
    ins => ins.athlete_id === currentAthleteId
  ) || [];
  
  // Filtrar eventos que ya están inscriptos
  const availableEventsFiltered = availableEvents?.filter(event => {
    return !currentAthleteInscriptions.some(ins => ins.event_id === event.id);
  }) || [];
  
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
            <p id="meetTimeLeft">en {timeLeft(meet.date)}</p>
            <p id="meetDate">{dateFullFormatter(meet.date)}</p>
            <p id="meetName">{meet.name}</p>

            <div id="meetTags">
              <button className="tag" onClick={handleMapClick} type="button" >
                <Icon name="map" size={18} color={COLORS.white_01} />
                <p>{meet.place_name}</p>
              </button>
              <button onClick={() => navigate(`/inscriptions/${id}`)}>
                <p>Ver {meet.athletes} Inscripciones</p>
              </button>
            </div>
          </div>

          <div id="athletesSelection">
            <h4>Selecciona Atletas</h4>
            
            <div id="searchContainer">
              <Icon name="search" size={20} color={COLORS.black_01} />
              <input
                type="text"
                id="athleteSearch"
                placeholder="Buscar atleta por nombre..."
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
                    <button
                      key={athlete.id}
                      className={`athleteCard ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleAthleteSelect(athlete.id)}
                    >
                      <img src={profileImageGetter(athlete.image)} alt={athlete.name} />
                      <div className="athleteInfo">
                        <p className="athleteName">{athlete.name}</p>
                        <p className="athleteCategory">{categoryGetter(athlete.born)}</p>
                        {existingInscriptionsForAthlete.length > 0 && (
                          <p className="athleteInscriptions">
                            {existingInscriptionsForAthlete.length} prueba{existingInscriptionsForAthlete.length > 1 ? 's' : ''} inscripta{existingInscriptionsForAthlete.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      {athleteInscriptions > 0 && (
                        <div className="inscriptionBadge">{athleteInscriptions}</div>
                      )}
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
        </section>

        <section>
          <div id="headerSpacer"/>

          {currentAthlete && (
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
                          <p>{ins.discipline}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {availableEventsFiltered && availableEventsFiltered.length > 0 ? (
                <div id="eventsList">
                  {availableEventsFiltered.map(event => {
                    const isInscribed = currentAthleteInscriptions.some(ins => ins.event_id === event.id);
                    const isSelected = isEventSelected(event.id);
                    
                    return (
                      <button
                        key={event.id}
                        className={`eventCard ${isSelected ? 'selected' : ''} ${isInscribed ? 'inscribed' : ''}`}
                        onClick={() => handleEventToggle(event.id, event.price, event.discipline, event.time)}
                        disabled={isInscribed}
                      >
                        <div className="eventInfo">
                          <div className="eventTimeDiscipline">
                            <p className="eventTime">{timeGetter(event.time)}</p>
                            <p className="eventName">{event.discipline}</p>
                          </div>
                          <p className="eventPrice">${formatPrice(event.price)}</p>
                        </div>
                        <div className="eventCheck">
                          {isInscribed ? (
                            <Icon name="check" size={20} color={COLORS.white_01} />
                          ) : (
                            <Icon 
                              name={isSelected ? "check" : "plus"} 
                              size={20} 
                              color={isSelected ? COLORS.white_01 : COLORS.black_01} 
                            />
                          )}
                        </div>
                      </button>
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

          {!currentAthlete && (
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
          )}

          {getTotalInscriptions() > 0 && (
            <div id="checkoutButton">
              <button onClick={handleCheckout}>
                <p>Ver Resumen ({getTotalInscriptions()} inscripciones)</p>
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
                              <p>{event.discipline || 'Evento'}</p>
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
              <p>Total a pagar:</p>
              <p className="totalAmount">${formatPrice(calculateTotal())}</p>
            </div>
              <button 
                id="payButton" 
                onClick={() => handlePayment(false)}
                disabled={isProcessing}
              >
                {isProcessing ? "Procesando..." : "PAGAR"}
              </button>
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
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                  No hay fondos suficientes para realizar este pago.
                </p>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
                  Fondos disponibles: ${formatPrice(clubFunds || 0)}
                </p>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
                  Total a pagar: ${formatPrice(calculateTotal())}
                </p>
                <p style={{ fontSize: '16px', color: '#666' }}>
                  Elige una opción para continuar:
                </p>
              </div>
            </div>

            <div id="checkoutFooter" style={{ flexDirection: 'column', gap: '10px' }}>
              <button 
                id="payButton" 
                onClick={handlePayWithMP}
                disabled={isProcessing}
                style={{ width: '100%' }}
              >
                {isProcessing ? "Procesando..." : "PAGAR TODO CON MERCADO PAGO"}
              </button>
              <button 
                onClick={() => setShowInsufficientFundsModal(false)}
                disabled={isProcessing}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#ccc', 
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  fontSize: '16px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transition(ClubMeet);

