import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { makeRequest } from "../config/axios";
import { useAuthClub } from "../contexts/AuthContextClub";
import { profileImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import { timeGetter } from "../constants/timeGetter";
import { formatPrice } from "../constants/priceFormatter";
import { toast } from "material-react-toastify";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useEffect, useState } from "react";

function ClubInscriptions() {
  useEffect(() => {import("./styles/clubInscriptions.scss")}, []);

  const { meetId } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuthClub();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState(null);

  // Obtener información del torneo
  const { data: meet, isLoading: isLoadingMeet } = useQuery({
    queryFn: () => makeRequest.get(`/meets/${meetId}`).then((res) => res.data),
    queryKey: ["meet", meetId],
  });

  // Obtener inscripciones del club en este torneo
  const { data: clubInscriptions, isLoading: isLoadingInscriptions, refetch: refetchInscriptions } = useQuery({
    queryFn: () => makeRequest.get(`/clubs/own/athletes/inscriptions/${meetId}`, {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubInscriptions", meetId],
    enabled: !!authState?.token,
  });

  // Mutación para anular inscripción
  const cancelInscriptionMutation = useMutation({
    mutationFn: (inscriptionId) => 
      makeRequest.delete(`/clubs/own/inscriptions/${inscriptionId}`, {
        headers: { Authorization: authState?.token }
      }),
    onSuccess: (response) => {
      toast.success(`Inscripción anulada. Reintegrados $${formatPrice(response.data.refunded_amount)}`, { theme: "colored" });
      setShowCancelModal(false);
      setSelectedInscription(null);
      // Refrescar datos
      refetchInscriptions();
      queryClient.invalidateQueries(["clubFunds"]);
    },
    onError: (error) => {
      const errorMessage = error.response?.data || "Error al anular la inscripción";
      toast.error(errorMessage, { theme: "colored" });
    }
  });

  // Obtener atletas del club
  const { data: clubAthletes } = useQuery({
    queryFn: () => makeRequest.get("/clubs/own/athletes", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubAthletes"],
    enabled: !!authState?.token,
  });

  if (isLoadingMeet || isLoadingInscriptions) {
    return (
      <div id="ClubInscriptions">
        <nav>
          <button id="backButton" onClick={() => navigate(-1)}>
            <Icon name="left-arrow" size={24} color={COLORS.black_01} />
          </button>
        </nav>
        <main>
          <div className="loading">
            <p>Cargando inscripciones...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!meet) {
    return (
      <div id="ClubInscriptions">
        <nav>
          <button id="backButton" onClick={() => navigate(-1)}>
            <Icon name="left-arrow" size={24} color={COLORS.black_01} />
          </button>
        </nav>
        <main>
          <div className="error">
            <p>Torneo no encontrado</p>
          </div>
        </main>
      </div>
    );
  }

  // Agrupar inscripciones por horario/prueba
  const groupedInscriptions = {};
  clubInscriptions?.forEach(inscription => {
    const timeKey = timeGetter(inscription.time);
    if (!groupedInscriptions[timeKey]) {
      groupedInscriptions[timeKey] = {
        time: inscription.time,
        discipline: inscription.discipline,
        athletes: []
      };
    }
    groupedInscriptions[timeKey].athletes.push(inscription);
  });

  // Calcular total gastado
  const totalSpent = clubInscriptions?.reduce((total, inscription) => {
    return total + parseFloat(inscription.price || 0);
  }, 0) || 0;

  // Handlers para anular inscripción
  const handleCancelClick = (inscription, athlete) => {
    setSelectedInscription({ ...inscription, athlete });
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (selectedInscription) {
      cancelInscriptionMutation.mutate(selectedInscription.inscription_id);
    }
  };

  const handleDownloadExcel = () => {
    const headers = ["Nombre del atleta", "Prueba", "Categoría"];
    const rows = (clubInscriptions || []).map((inscription) => {
      const athlete = clubAthletes?.find((a) => a.id === inscription.athlete_id);
      return [
        athlete?.name ?? "—",
        inscription.discipline ?? "—",
        athlete ? categoryGetter(athlete.born) : "—",
      ];
    });
    const excelData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    worksheet["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 14 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inscriptos");
    const fileName = `${meet?.name || "Inscriptos"}_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Excel descargado", { theme: "colored" });
  };

  return (
    <div id="ClubInscriptions">
      <nav>
        <button id="backButton" onClick={() => navigate(-1)}>
          <Icon name="left-arrow" size={24} color={COLORS.black_01} />
        </button>

      </nav>

      <main>

        <div className="navInfo">
          <h1>Mis Inscriptos</h1>
          <p>{meet.name}</p>
          {Object.keys(groupedInscriptions).length > 0 && (
            <button type="button" className="downloadExcelButton" onClick={handleDownloadExcel}>
              <Icon name="pdf" size={20} color={COLORS.white_01} />
              <span>Descargar Excel</span>
            </button>
          )}
        </div>
        {Object.keys(groupedInscriptions).length > 0 ? (
        <>
          <div className="inscriptionsGrid">
            {Object.entries(groupedInscriptions).map(([timeKey, eventData]) => (
              <div key={timeKey} className="eventCard">
                <div className="eventHeader">
                  <div className="eventTimeBadge">
                    <Icon name="clock" size={24} color={COLORS.white_01} />
                    <span>{timeKey}</span>
                  </div>
                  <div className="eventInfo">
                    <h3 className="eventDiscipline">{eventData.discipline}</h3>
                    <span className="athletesCount">
                      {eventData.athletes.length} atleta{eventData.athletes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="athletesList">
                  {eventData.athletes.map(inscription => {
                    const athlete = clubAthletes?.find(a => a.id === inscription.athlete_id);
                    if (!athlete) return null;

                    const isPaidWithFunds = inscription.payment_type === 'club_funds';

                    return (
                      <div key={inscription.inscription_id} className="athleteCard">
                        <div className="athleteInfo">
                          <img
                            src={profileImageGetter(athlete.image)}
                            alt={athlete.name}
                            className="athleteImage"
                          />
                          <div className="athleteDetails">
                            <h4 className="athleteName">{athlete.name}</h4>
                            <p className="athleteCategory">{categoryGetter(athlete.born)}</p>
                            {isPaidWithFunds && (
                              <span className="paymentBadge">Fondo Club</span>
                            )}
                          </div>
                        </div>
                        <div className="inscriptionActions">
                          <span className="price">${formatPrice(inscription.price || 0)}</span>
                          {isPaidWithFunds && (
                            <button 
                              className="cancelButton"
                              onClick={() => handleCancelClick(inscription, athlete)}
                              title="Anular inscripción y reintegrar fondos"
                            >
                              <Icon name="trash" size={18} color={COLORS.red_01} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="expensesSummary">
            <div className="summaryHeader">
              <Icon name="note-edit" size={24} color={COLORS.black_01} />
              <h3 className="summaryTitle">Resumen de Inscripciones</h3>
            </div>
            <div className="summaryContent">
              <div className="summaryItem">
                <span className="itemLabel">Atletas inscriptos:</span>
                <span className="itemValue">{clubInscriptions.length}</span>
              </div>
              <div className="summaryItem total">
                <span className="itemLabel">Total gastado:</span>
                <span className="itemValue amount">${formatPrice(totalSpent)}</span>
              </div>
            </div>
          </div>
          </>
        ) : (
          <div className="emptyState">
            <Icon name="user" size={48} color={COLORS.gray_01} />
            <h3>Aún no has inscripto atletas</h3>
            <p>Los atletas que inscribas en este torneo aparecerán aquí</p>
            <button
              className="backToMeetButton"
              onClick={() => navigate(`/club/meet/${meetId}`)}
            >
              Ir al Torneo
            </button>
          </div>
        )}
      </main>

      {/* Modal de confirmación para anular inscripción */}
      {showCancelModal && selectedInscription && (
        <div className="cancelModal" onClick={() => setShowCancelModal(false)}>
          <div className="cancelModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="cancelModalHeader">
              <h3>¿Anular inscripción?</h3>
              <button onClick={() => setShowCancelModal(false)}>✕</button>
            </div>
            
            <div className="cancelModalBody">
              <div className="warningIcon">
                <Icon name="warning" size={48} color={COLORS.orange_01} />
              </div>
              
              <div className="inscriptionDetails">
                <p className="athleteName">{selectedInscription.athlete?.name}</p>
                <p className="eventInfo">{timeGetter(selectedInscription.time)} - {selectedInscription.discipline}</p>
                <p className="refundAmount">Se reintegrarán <strong>${formatPrice(selectedInscription.price || 0)}</strong> al fondo del club</p>
              </div>

              <p className="warningText">Esta acción no se puede deshacer. El atleta será eliminado de esta prueba.</p>
            </div>

            <div className="cancelModalFooter">
              <button 
                className="confirmButton"
                onClick={handleConfirmCancel}
                disabled={cancelInscriptionMutation.isLoading}
              >
                {cancelInscriptionMutation.isLoading ? "Anulando..." : "Sí, anular inscripción"}
              </button>
              <button 
                className="cancelActionButton"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelInscriptionMutation.isLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transition(ClubInscriptions);
