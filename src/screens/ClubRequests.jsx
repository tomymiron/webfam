import "material-react-toastify/dist/ReactToastify.css";
import { useAuthClub } from "../contexts/AuthContextClub";
import { profileImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import { toast } from "material-react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import { useEffect, useState } from "react";
import Transition from "../Transition";

function ClubRequests() {
  useEffect(() => {import("./styles/clubRequests.scss")}, []);

  const { authState } = useAuthClub();
  const queryClient = useQueryClient();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  const { data: requests, isLoading, isError } = useQuery({
    queryFn: () => makeRequest.get("/clubs/own/requests", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubRequests"],
    enabled: !!authState?.token,
  });

  const handleApproveClick = (request) => {
    setPendingRequest(request);
    setShowConfirmModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!pendingRequest) return;

    try {
      await makeRequest.put(`/clubs/own/requests/${pendingRequest.id}/status`, { status: 2 }, {
        headers: { Authorization: authState?.token }
      });

      toast.success("Solicitud aprobada exitosamente", { theme: "colored" });
      
      queryClient.invalidateQueries(["clubRequests"]);
      setShowConfirmModal(false);
      setPendingRequest(null);
    } catch (err) {
      console.error("Error al aprobar solicitud:", err);
      toast.error(err.response?.data || "Error al aprobar la solicitud", { theme: "colored" });
    }
  };

  const handleReject = async (requestId) => {
    try {
      await makeRequest.put(`/clubs/own/requests/${requestId}/status`, { status: 3 }, {
        headers: { Authorization: authState?.token }
      });

      toast.success("Solicitud rechazada exitosamente", { theme: "colored" });
      
      queryClient.invalidateQueries(["clubRequests"]);
    } catch (err) {
      console.error("Error al rechazar solicitud:", err);
      toast.error(err.response?.data || "Error al rechazar la solicitud", { theme: "colored" });
    }
  };

  return (
    <div id="ClubRequests">
      <NavBar />

      <main>
        <section>
          <div id="header">
            <h2>SOLICITUDES DE<br/>ASOCIACIÓN</h2>
            <div className="lineSeparator"/>
            <p>Revisa y gestiona las solicitudes de atletas.</p>
          </div>

          <div id="requestsContainer">
            {isLoading ? (
              <p>Cargando...</p>
            ) : isError ? (
              <p>Error al cargar solicitudes</p>
            ) : requests && requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="requestItem">
                  <div className="requestItemTop">
                    <div className="athleteImage">
                      <img src={profileImageGetter(request.athlete_image)} alt={request.athlete_name} />
                    </div>

                    <div className="requestInfo">
                      <div className="requestHeader">
                        <h3>{request.athlete_name}</h3>
                        <div className={`statusBadge status-${request.status}`}>
                          {request.status === 1 && "PENDIENTE"}
                          {request.status === 2 && "APROBADO"}
                          {request.status === 3 && "RECHAZADO"}
                        </div>
                      </div>

                      <div className="requestDetails">
                        <p><strong>DNI:</strong> {request.dni}</p>
                        <p><strong>Email:</strong> {request.email}</p>
                        <p><strong>Categoría:</strong> {categoryGetter(request.born)}</p>
                        <p><strong>Fecha solicitud:</strong> {new Date(request.created_at).toLocaleDateString('es-AR')}</p>
                      </div>
                    </div>
                  </div>

                  {request.status !== 2 && (
                    <div className="requestItemBottom">
                      <button 
                        className="approveButton"
                        onClick={() => handleApproveClick(request)}
                      >
                        APROBAR
                      </button>
                      <button 
                        className="rejectButton"
                        onClick={() => handleReject(request.id)}
                      >
                        RECHAZAR
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="emptyMessage">No hay solicitudes</p>
            )}
          </div>
        </section>
      </main>

      {/* Modal de confirmación */}
      {showConfirmModal && pendingRequest && (
        <div id="confirmModal" onClick={() => setShowConfirmModal(false)}>
          <div id="confirmModalContent" onClick={(e) => e.stopPropagation()}>
            <h3>¿Estás seguro que querés aprobar esta solicitud?</h3>
            <div className="confirmModalInfo">
              <p><strong>Atleta:</strong> {pendingRequest.athlete_name}</p>
              <p><strong>DNI:</strong> {pendingRequest.dni}</p>
            </div>
            <div className="confirmModalActions">
              <button 
                className="confirmCancelButton"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingRequest(null);
                }}
              >
                CANCELAR
              </button>
              <button 
                className="confirmApproveButton"
                onClick={handleConfirmApprove}
              >
                APROBAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transition(ClubRequests);

