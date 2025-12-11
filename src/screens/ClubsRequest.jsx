import "material-react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "material-react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import { useEffect, useState, useMemo } from "react";
import { COLORS } from "../constants/theme";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import { profileImageGetter } from "../constants/imageGetter";

function ClubsRequest() {
  useEffect(() => {import("./styles/clubsRequest.scss")}, []);

  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clubs, isLoading, isError } = useQuery({
    queryFn: () => makeRequest.get("/clubs/available", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubs", authState?.token],
    enabled: !!authState?.token,
  });

  // Determinar el estado global de solicitudes
  const requestStatus = useMemo(() => {
    // Prioridad 1: Si el usuario tiene un club_id, usar ese (ignora todos los status)
    if (authState?.user?.club_id && authState.user.club_id !== null) {
      return { type: 'approved', clubId: authState.user.club_id };
    }
    
    if (!clubs) return null;
    
    // Prioridad 2: Buscar si hay alguna solicitud aprobada (status = 2)
    const approvedClub = clubs.find(club => club.status === 2);
    if (approvedClub) {
      return { type: 'approved', clubId: approvedClub.id };
    }
    
    // Prioridad 3: Buscar si hay alguna solicitud pendiente (status = 1)
    const pendingClub = clubs.find(club => club.status === 1);
    if (pendingClub) {
      return { type: 'pending', clubId: pendingClub.id };
    }
    
    return { type: 'none' };
  }, [clubs, authState?.user?.club_id]);

  const handleRequestAssociation = async (clubId) => {
    try {
      const res = await makeRequest.post(
        `/clubs/${clubId}/request`,
        {},
        {
          headers: { Authorization: authState?.token }
        }
      );
      
      const message = res.data?.message || "Solicitud enviada exitosamente";
      toast.success(message, { theme: "colored" });
      
      // Invalidar y refetch los clubes para actualizar los estados
      queryClient.invalidateQueries(["clubs", authState?.token]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al enviar la solicitud";
      toast.error(errorMessage, { theme: "colored" });
    }
  };

  const handleCancelRequest = async (clubId) => {
    try {
      const res = await makeRequest.delete(
        `/clubs/${clubId}/request`,
        {
          headers: { Authorization: authState?.token }
        }
      );
      
      const message = res.data?.message || "Solicitud cancelada exitosamente";
      toast.success(message, { theme: "colored" });
      
      // Invalidar y refetch los clubes para actualizar los estados
      queryClient.invalidateQueries(["clubs", authState?.token]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al cancelar la solicitud";
      toast.error(errorMessage, { theme: "colored" });
    }
  };

  // Filtrar clubes según el término de búsqueda
  const filteredClubs = clubs?.filter(club => 
    club.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.alias?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Función para renderizar el botón/estado según el status del club
  const renderClubStatus = (club) => {
    const status = club.status;
    
    // Prioridad 1: Si el usuario tiene un club_id, mostrar estado solo en ese club
    if (authState?.user?.club_id && authState.user.club_id !== null) {
      if (club.id === authState.user.club_id) {
        return (
          <div className="statusBadge approved">ASOCIADO A ESTE CLUB</div>
        );
      }
      // No mostrar botones en otros clubes si el usuario ya tiene un club
      return null;
    }
    
    // Si hay un club aprobado (status = 2), solo mostrar estado en ese club
    if (requestStatus.type === 'approved') {
      if (club.id === requestStatus.clubId) {
        return (
          <div className="statusBadge approved">ASOCIADO A ESTE CLUB</div>
        );
      }
      // No mostrar botones en otros clubes si ya está aprobado en uno
      return null;
    }
    
    // Si hay una solicitud pendiente (status = 1)
    if (requestStatus.type === 'pending') {
      if (club.id === requestStatus.clubId) {
        return (
          <button className="requestButton pendingCancel" onClick={() => handleCancelRequest(club.id)}>
            <span className="pendingText">Esperando confirmación</span>
            <span className="cancelText">CANCELAR</span>
          </button>
        );
      }
      // Deshabilitar botones en otros clubes
      return (
        <button className="requestButton disabled" disabled>
          SOLICITAR ASOCIACION
        </button>
      );
    }
    
    // Si el status es null, mostrar botón habilitado
    if (status === null) {
      return (
        <button className="requestButton" onClick={() => handleRequestAssociation(club.id)}>
          SOLICITAR ASOCIACION
        </button>
      );
    }
    
    // Si el status es 3 (rejected), mostrar rechazado pero permitir solicitar de nuevo
    if (status === 3) {
      return (
        <div className="statusContainer">
          <div className="statusBadge rejected">
            Rechazado
          </div>
          <button className="requestButton" onClick={() => handleRequestAssociation(club.id)}>
            SOLICITAR ASOCIACION
          </button>
        </div>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div id="ClubsRequest">
        <NavBar />
        <main>
          <div className="loadingContainer">
            <p>Cargando clubes...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div id="ClubsRequest">
        <NavBar />
        <main>
          <div className="errorContainer">
            <p>Error al cargar los clubes</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div id="ClubsRequest">
      <NavBar />

      <main>
        <div id="clubsRequestContent">
          <h1>ASOCIACION A CLUB</h1>
          <p id="description">Busca y solicita asociarte a un club al cual pertenecer.</p>

          <input
            id="searchInput"
            type="text"
            placeholder="Buscar club"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div id="clubsSection">
            <h2>Clubes disponibles</h2>
            <div id="clubsList">
              {filteredClubs.length === 0 ? (
                <div id="noClubs">
                  <p>No se encontraron clubes</p>
                </div>
              ) : (
                filteredClubs.map((club) => (
                  <div key={club.id} className="clubItem">
                    <div className="clubMainInfo">
                      <div className="clubLogo">
                        <img src={profileImageGetter(club.image)} alt={club.name} />
                      </div>
                      <div className="clubInfo">
                        <h3>{club.name?.toUpperCase()}</h3>
                        <div className="clubInfoSeparator" />
                        <p>{club.athletes || 0} Atletas</p>
                      </div>
                    </div>
                    {renderClubStatus(club)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Transition(ClubsRequest);

