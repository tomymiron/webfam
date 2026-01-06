import "material-react-toastify/dist/ReactToastify.css";
import { useAuthClub } from "../contexts/AuthContextClub";
import { profileImageGetter, receiptImageGetter } from "../constants/imageGetter";
import { toast } from "material-react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import { useEffect, useState } from "react";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";

function ClubTransfers() {
  useEffect(() => {import("./styles/clubTransfers.scss")}, []);

  const { authState } = useAuthClub();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("request"); // "request", "sent", "received"
  const [searchTerm, setSearchTerm] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isConfirmingRequest, setIsConfirmingRequest] = useState(false);

  // Fetch sent transfers
  const { data: sentTransfers, isLoading: isLoadingSent } = useQuery({
    queryFn: () => makeRequest.get("/transfers/club/sent", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubSentTransfers"],
    enabled: !!authState?.token && activeTab === "sent",
  });

  // Fetch received transfers
  const { data: receivedTransfers, isLoading: isLoadingReceived } = useQuery({
    queryFn: () => makeRequest.get("/transfers/club/received", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubReceivedTransfers"],
    enabled: !!authState?.token && activeTab === "received",
  });

  // Search athletes
  const { data: athletesData, isLoading: isLoadingAthletes } = useQuery({
    queryFn: () => makeRequest.get("/transfers/search-athletes", {
      params: { search: searchTerm, page: searchPage, limit: 20 },
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["searchAthletes", searchTerm, searchPage],
    enabled: !!authState?.token && activeTab === "request" && searchTerm.length >= 2,
  });

  const handleRequestTransfer = (athlete) => {
    setSelectedAthlete(athlete);
    setShowConfirmModal(true);
  };

  const handleConfirmRequest = async () => {
    if (!selectedAthlete || isConfirmingRequest) return;

    setIsConfirmingRequest(true);
    try {
      await makeRequest.post("/transfers", { athlete_id: selectedAthlete.id }, {
        headers: { Authorization: authState?.token }
      });

      toast.success("Solicitud de pase enviada exitosamente", { theme: "colored" });
      setShowConfirmModal(false);
      setSelectedAthlete(null);
      setSearchTerm("");
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries(["clubSentTransfers"]);
      queryClient.invalidateQueries(["athleteTransfers"]);
      queryClient.invalidateQueries(["adminTransfers"]);
    } catch (err) {
      console.error("Error al solicitar pase:", err);
      toast.error(err.response?.data || "Error al solicitar el pase", { theme: "colored" });
    } finally {
      setIsConfirmingRequest(false);
    }
  };

  const handleApproveReceived = async (transferId) => {
    try {
      await makeRequest.put(`/transfers/club/approve/${transferId}`, {}, {
        headers: { Authorization: authState?.token }
      });

      toast.success("Transferencia aprobada exitosamente", { theme: "colored" });
      // Invalidar todas las queries relacionadas para actualizar la UI en todos los componentes
      queryClient.invalidateQueries(["clubReceivedTransfers"]);
      queryClient.invalidateQueries(["clubSentTransfers"]);
      queryClient.invalidateQueries(["athleteTransfers"]);
      queryClient.invalidateQueries(["adminTransfers"]);
    } catch (err) {
      console.error("Error al aprobar transferencia:", err);
      toast.error(err.response?.data || "Error al aprobar la transferencia", { theme: "colored" });
    }
  };

  const handleRejectReceived = async (transferId) => {
    try {
      await makeRequest.put(`/transfers/club/reject/${transferId}`, {}, {
        headers: { Authorization: authState?.token }
      });

      toast.success("Transferencia rechazada exitosamente", { theme: "colored" });
      // Invalidar todas las queries relacionadas para actualizar la UI en todos los componentes
      queryClient.invalidateQueries(["clubReceivedTransfers"]);
      queryClient.invalidateQueries(["clubSentTransfers"]);
      queryClient.invalidateQueries(["athleteTransfers"]);
      queryClient.invalidateQueries(["adminTransfers"]);
    } catch (err) {
      console.error("Error al rechazar transferencia:", err);
      toast.error(err.response?.data || "Error al rechazar la transferencia", { theme: "colored" });
    }
  };

  const handleReceiptChange = (e, transferId) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Solo se permiten archivos de imagen (JPEG, PNG) o PDF", { theme: "colored" });
        return;
      }
      
      if (file.size > 4 * 1024 * 1024) {
        toast.error("El archivo no debe superar los 4MB", { theme: "colored" });
        return;
      }
      
      setSelectedTransfer({ id: transferId, file });
      setSelectedReceipt(file);
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedTransfer || !selectedReceipt) {
      toast.error("Por favor selecciona un archivo", { theme: "colored" });
      return;
    }

    setIsUploadingReceipt(true);
    
    try {
      const formData = new FormData();
      formData.append('receipt', selectedReceipt);

      await makeRequest.post(`/transfers/${selectedTransfer.id}/receipt`, formData, {
        headers: {
          Authorization: authState?.token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success("Comprobante subido exitosamente", { theme: "colored" });
      setSelectedReceipt(null);
      const transferId = selectedTransfer.id;
      setSelectedTransfer(null);
      
      const fileInput = document.getElementById(`receiptInput-${transferId}`);
      if (fileInput) fileInput.value = '';
      
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries(["clubSentTransfers"]);
      queryClient.invalidateQueries(["adminTransfers"]);
    } catch (err) {
      console.error("Error al subir comprobante:", err);
      toast.error(err.response?.data?.message || err.response?.data || "Error al subir el comprobante", { theme: "colored" });
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const getStatusLabel = (status) => {
    if (status === 6) return "RECHAZADO";
    if (status === 5) return "COMPLETADO";
    if (status === 4) return "PENDIENTE VALIDACIÓN";
    if (status === 3) return "ESPERANDO PAGO";
    if (status === 2) return "ESPERANDO COSTO";
    return "EN PROCESO";
  };

  const getStatusClass = (status) => {
    if (status === 6) return "status-rejected";
    if (status === 5) return "status-completed";
    if (status === 4) return "status-pending-validation";
    if (status === 3) return "status-waiting-payment";
    if (status === 2) return "status-waiting-price";
    return "status-pending";
  };

  const getApprovalStatus = (approved) => {
    if (approved === 1) return { label: "APROBADO", class: "approved" };
    if (approved === 0) return { label: "RECHAZADO", class: "rejected" };
    return { label: "PENDIENTE", class: "pending" };
  };

  return (
    <div id="ClubTransfers">
      <NavBar />

      <main>
        <section>
          <div className="pageHeader">
            <h1>Pases Interclubes</h1>
            <div className="headerSeparator" />
            <p>Gestiona las transferencias de atletas entre clubes</p>
          </div>

          {/* Tabs */}
          <div className="tabsContainer">
            <button 
              className={`tabButton ${activeTab === "request" ? "active" : ""}`}
              onClick={() => setActiveTab("request")}
            >
              Solicitar Pase
            </button>
            <button 
              className={`tabButton ${activeTab === "sent" ? "active" : ""}`}
              onClick={() => setActiveTab("sent")}
            >
              Solicitudes Enviadas
            </button>
            <button 
              className={`tabButton ${activeTab === "received" ? "active" : ""}`}
              onClick={() => setActiveTab("received")}
            >
              Solicitudes Recibidas
            </button>
          </div>

          {/* Request Tab */}
          {activeTab === "request" && (
            <div className="tabContent">
              <div className="searchBox">
                <Icon name="search" size={24} color={COLORS.black_01} />
                <input
                  type="text"
                  placeholder="Buscar atleta por nombre, DNI o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchPage(1);
                  }}
                  className="searchInput"
                />
              </div>

              {searchTerm.length < 2 ? (
                <div className="emptyState">
                  <Icon name="search" size={48} color={COLORS.black_01} />
                  <p>Ingresa al menos 2 caracteres para buscar atletas</p>
                </div>
              ) : isLoadingAthletes ? (
                <div className="emptyState">
                  <div className="loadingSpinner" />
                  <p>Buscando atletas...</p>
                </div>
              ) : athletesData?.athletes && athletesData.athletes.length > 0 ? (
                <>
                  <div className="athletesGrid">
                    {athletesData.athletes.map((athlete) => (
                      <div key={athlete.id} className="athleteCard">
                        <div className="athleteCardHeader">
                          <div className="athleteAvatar">
                            <img src={profileImageGetter(athlete.image)} alt={athlete.name} />
                          </div>
                          <div className="athleteBasicInfo">
                            <h3>{athlete.name}</h3>
                            <p className="athleteDNI">DNI: {athlete.dni}</p>
                          </div>
                        </div>
                        <div className="athleteDetails">
                          <div className="detailRow">
                            <span className="detailLabel">Email</span>
                            <span className="detailValue">{athlete.email}</span>
                          </div>
                          <div className="detailRow">
                            <span className="detailLabel">Edad</span>
                            <span className="detailValue">{athlete.age} años</span>
                          </div>
                          <div className="detailRow">
                            <span className="detailLabel">Club actual</span>
                            <span className="detailValue">{athlete.club_name || athlete.club_alias || "Sin club"}</span>
                          </div>
                        </div>
                        <button 
                          className="requestButton"
                          onClick={() => handleRequestTransfer(athlete)}
                        >
                          Solicitar Pase
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {athletesData.pagination.totalPages > searchPage && (
                    <div className="loadMoreContainer">
                      <button
                        className="loadMoreButton"
                        onClick={() => setSearchPage(searchPage + 1)}
                      >
                        Cargar más resultados
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="emptyState">
                  <Icon name="search" size={48} color={COLORS.black_01} />
                  <p>No se encontraron atletas</p>
                </div>
              )}
            </div>
          )}

          {/* Sent Transfers Tab */}
          {activeTab === "sent" && (
            <div className="tabContent">
              {isLoadingSent ? (
                <div className="emptyState">
                  <div className="loadingSpinner" />
                  <p>Cargando solicitudes...</p>
                </div>
              ) : sentTransfers && sentTransfers.length > 0 ? (
                <div className="transfersList">
                  {sentTransfers.map((transfer) => (
                    <div key={transfer.id} className="transferCard">
                      <div className="transferCardHeader">
                        <div className="transferCardMainInfo">
                          <div className="athleteAvatar">
                            <img src={profileImageGetter(transfer.athlete_image)} alt={transfer.athlete_name} />
                          </div>
                          <div className="athleteInfo">
                            <h3>{transfer.athlete_name}</h3>
                            <p className="transferDate">Fecha: {new Date(transfer.created_at).toLocaleDateString('es-AR')}</p>
                          </div>
                        </div>
                        <div className={`transferStatusBadge ${getStatusClass(transfer.status)}`}>
                          {getStatusLabel(transfer.status)}
                        </div>
                      </div>

                      <div className="transferClubsInfo">
                        <div className="clubInfoItem">
                          <span className="clubLabel">Club Actual</span>
                          <span className="clubName">{transfer.current_club_name || transfer.current_club_alias || "Sin club"}</span>
                        </div>
                      </div>

                      <div className="transferApprovals">
                        <div className="approvalItem">
                          <span className="approvalLabel">Club Solicitante</span>
                          <span className="approvalBadge approved">APROBADO</span>
                        </div>
                        <div className="approvalItem">
                          <span className="approvalLabel">Atleta</span>
                          <span className={`approvalBadge ${getApprovalStatus(transfer.athlete_approved).class}`}>
                            {getApprovalStatus(transfer.athlete_approved).label}
                          </span>
                        </div>
                        <div className="approvalItem">
                          <span className="approvalLabel">Club del Atleta</span>
                          <span className={`approvalBadge ${getApprovalStatus(transfer.club_approved).class}`}>
                            {getApprovalStatus(transfer.club_approved).label}
                          </span>
                        </div>
                      </div>

                      {transfer.admin_price && (
                        <div className="transferPriceDisplay">
                          <span className="priceLabel">Costo a pagar</span>
                          <span className="priceValue">${transfer.admin_price}</span>
                        </div>
                      )}

                      {transfer.receipt_file && (
                        <div className="receiptDisplay">
                          <div className="receiptInfo">
                            <span className="receiptLabel">Comprobante</span>
                            <button 
                              className="viewReceiptButton"
                              onClick={() => {
                                setShowReceiptModal(true);
                                setSelectedTransfer(transfer);
                              }}
                            >
                              Ver comprobante
                            </button>
                          </div>
                          <span className={`receiptStatus ${transfer.receipt_status === 1 ? 'pending' : transfer.receipt_status === 2 ? 'approved' : 'rejected'}`}>
                            {transfer.receipt_status === 1 && "Pendiente de validación"}
                            {transfer.receipt_status === 2 && "Aprobado"}
                            {transfer.receipt_status === 3 && "Rechazado"}
                          </span>
                        </div>
                      )}

                      {transfer.status === 3 && (
                        <div className="transferActionSection receiptUploadSection">
                          <div className="actionHeader">
                            <h4>Subir Comprobante de Pago</h4>
                            {transfer.admin_price && (
                              <span className="priceRequired">Monto requerido: ${transfer.admin_price}</span>
                            )}
                          </div>
                          <div className="receiptUploadContent">
                            <input
                              type="file"
                              id={`receiptInput-${transfer.id}`}
                              accept="image/jpeg,image/jpg,image/png,application/pdf"
                              onChange={(e) => handleReceiptChange(e, transfer.id)}
                              className="fileInput"
                            />
                            <label htmlFor={`receiptInput-${transfer.id}`} className="fileInputLabel">
                              {selectedTransfer?.id === transfer.id && selectedReceipt 
                                ? selectedReceipt.name 
                                : "Seleccionar archivo"}
                            </label>
                            {selectedTransfer?.id === transfer.id && selectedReceipt && (
                              <button 
                                className="actionButton primary"
                                onClick={handleUploadReceipt}
                                disabled={isUploadingReceipt}
                              >
                                {isUploadingReceipt ? "Subiendo..." : "Subir Comprobante"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyState">
                  <Icon name="search" size={48} color={COLORS.black_01} />
                  <p>No hay solicitudes enviadas</p>
                </div>
              )}
            </div>
          )}

          {/* Received Transfers Tab */}
          {activeTab === "received" && (
            <div className="tabContent">
              {isLoadingReceived ? (
                <div className="emptyState">
                  <div className="loadingSpinner" />
                  <p>Cargando solicitudes...</p>
                </div>
              ) : receivedTransfers && receivedTransfers.length > 0 ? (
                <div className="transfersList">
                  {receivedTransfers.map((transfer) => (
                    <div key={transfer.id} className="transferCard">
                      <div className="transferCardHeader">
                        <div className="transferCardMainInfo">
                          <div className="athleteAvatar">
                            <img src={profileImageGetter(transfer.athlete_image)} alt={transfer.athlete_name} />
                          </div>
                          <div className="athleteInfo">
                            <h3>{transfer.athlete_name}</h3>
                            <p className="transferDate">Fecha: {new Date(transfer.created_at).toLocaleDateString('es-AR')}</p>
                          </div>
                        </div>
                        <div className={`transferStatusBadge ${getStatusClass(transfer.status)}`}>
                          {getStatusLabel(transfer.status)}
                        </div>
                      </div>

                      <div className="transferClubsInfo">
                        <div className="clubInfoItem">
                          <span className="clubLabel">Club Solicitante</span>
                          <span className="clubName">{transfer.requesting_club_name || transfer.requesting_club_alias}</span>
                        </div>
                      </div>

                      <div className="transferApprovals">
                        <div className="approvalItem">
                          <span className="approvalLabel">Club Solicitante</span>
                          <span className="approvalBadge approved">APROBADO</span>
                        </div>
                        <div className="approvalItem">
                          <span className="approvalLabel">Atleta</span>
                          <span className={`approvalBadge ${getApprovalStatus(transfer.athlete_approved).class}`}>
                            {getApprovalStatus(transfer.athlete_approved).label}
                          </span>
                        </div>
                        <div className="approvalItem">
                          <span className="approvalLabel">Club del Atleta</span>
                          <span className={`approvalBadge ${getApprovalStatus(transfer.club_approved).class}`}>
                            {getApprovalStatus(transfer.club_approved).label}
                          </span>
                        </div>
                      </div>

                      {transfer.status === 1 && transfer.club_approved === null && (
                        <div className="transferActionSection approvalSection">
                          <div className="actionHeader">
                            <h4>Acción Requerida</h4>
                            <p>Debes aprobar o rechazar esta solicitud de transferencia</p>
                          </div>
                          <div className="approvalActions">
                            <button 
                              className="actionButton success"
                              onClick={() => handleApproveReceived(transfer.id)}
                            >
                              Aprobar Solicitud
                            </button>
                            <button 
                              className="actionButton danger"
                              onClick={() => handleRejectReceived(transfer.id)}
                            >
                              Rechazar Solicitud
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyState">
                  <Icon name="search" size={48} color={COLORS.black_01} />
                  <p>No hay solicitudes recibidas</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Confirm Modal */}
      {showConfirmModal && selectedAthlete && (
        <div className="modalOverlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Confirmar Solicitud de Pase</h2>
            </div>
            <div className="modalBody">
              <div className="confirmAthleteInfo">
                <div className="confirmAvatar">
                  <img src={profileImageGetter(selectedAthlete.image)} alt={selectedAthlete.name} />
                </div>
                <div className="confirmDetails">
                  <h3>{selectedAthlete.name}</h3>
                  <div className="confirmDetailRow">
                    <span className="confirmLabel">DNI</span>
                    <span className="confirmValue">{selectedAthlete.dni}</span>
                  </div>
                  <div className="confirmDetailRow">
                    <span className="confirmLabel">Club actual</span>
                    <span className="confirmValue">{selectedAthlete.club_name || selectedAthlete.club_alias || "Sin club"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modalActions">
              <button 
                className="modalButton secondary"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedAthlete(null);
                }}
                disabled={isConfirmingRequest}
              >
                Cancelar
              </button>
              <button 
                className="modalButton primary"
                onClick={handleConfirmRequest}
                disabled={isConfirmingRequest}
              >
                {isConfirmingRequest ? "Enviando..." : "Confirmar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransfer && selectedTransfer.receipt_file && (
        <div className="modalOverlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modalContent receiptModal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h2>Comprobante de Pago</h2>
              <button className="closeButton" onClick={() => setShowReceiptModal(false)}>
                ✕
              </button>
            </div>
            <div className="modalBody receiptModalBody">
              {(() => {
                const ext = selectedTransfer.receipt_file.toLowerCase().split('.').pop();
                const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
                const fileUrl = receiptImageGetter(selectedTransfer.receipt_file);
                
                if (isImage) {
                  return <img src={fileUrl} alt="Comprobante" />;
                } else {
                  return <iframe src={fileUrl} title="Comprobante PDF" />;
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transition(ClubTransfers);
