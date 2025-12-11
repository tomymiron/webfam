import { resultGetter } from "../../constants/resultGetter";
import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { makeRequest } from "../../config/axios";
import { COLORS } from "../../constants/theme";
import Icon from "../../constants/Icon";

export default function InscriptionItem({ inscription, meetId }) {
  useEffect(() => {import("./styles/inscriptionItem.scss")}, []);
  const queryClient = useQueryClient();
  const { authState } = useAuth();

  const [inscriptionStatus, setInscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isAlreadyInscripted = inscription?.inscripted || inscriptionStatus === 'success';

  const toggleOpen = useCallback(() => setIsOpen(v => !v), []);
  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleOpen();
    }
  }, [toggleOpen]);
  

  const handleInscription = async () => {
    if (!authState?.authenticated) {
      setInscriptionStatus('error');
      return;
    }

    if (isAlreadyInscripted) return;
    setIsLoading(true);
    setInscriptionStatus(null);

    try {
      // Crear pago con MercadoPago
      const paymentData = {
        user_id: authState.user.id,
        event_id: inscription.id,
        meet_id: inscription.meet,
        description: inscription.event_name || inscription.discipline,
        amount: inscription.price
      };

      const response = await makeRequest.post('/payments/create', paymentData, {
        headers: { Authorization: authState.token }
      });

      if (response.status === 200) {
        const { init_point } = response.data;
        
        if (init_point) {
          console.log('Redirecting to MercadoPago:', init_point);
          // Guardar el meetId en sessionStorage para usarlo después del pago
          sessionStorage.setItem('pendingMeetId', meetId);
          window.location.href = init_point;
          return;
        } else {
          throw new Error('No se recibió el init_point de MercadoPago');
        }
      }
    } catch (error) {
      console.error('Error al crear pago:', error);
      setInscriptionStatus('error');
      setIsLoading(false);
    }
  };

  return (
    <div className={`inscriptionItem${isOpen ? " open" : ""} ${isLoading ? "loading" : ""}`}>
      <div className="top" role="button" tabIndex={0} aria-expanded={isOpen} onClick={toggleOpen} onKeyDown={onKeyDown}>
        <p className="event">{inscription?.discipline}</p>

        <div className={`optionButton ${isAlreadyInscripted ? "inscripted" : ""}`}>
          <Icon name={isOpen ? "close" : inscription?.inscripted ? "check" : "note-edit"} size={24} color={isAlreadyInscripted ? COLORS.black_01 : COLORS.white_01} />
        </div>
      </div>
      <div className="bottom">
        <div className="details">
          <p className="price">${inscription?.price}</p>
          {inscription?.best_mark
          ? <p className="mark">Tu mejor marca: <strong>{resultGetter(inscription?.best_mark, inscription?.unit)}</strong></p>
          : <p className="mark">Aun <strong>no tenes</strong> marca</p> }
        </div>

        <button className={`participate ${isLoading ? "loading" : ""} ${inscriptionStatus ? inscriptionStatus : ""} ${isAlreadyInscripted ? "inscripted" : ""}`} onClick={handleInscription} disabled={isLoading || isAlreadyInscripted}>
          {isLoading ? "Procesando..." : isAlreadyInscripted ? "¡Ya estás inscripto!" : inscriptionStatus === "error" ? "Error - Reintentar" : "Participar!"}
        </button>
      </div>
    </div>
  );
}