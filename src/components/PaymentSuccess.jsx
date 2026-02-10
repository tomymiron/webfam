import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "material-react-toastify";
import "material-react-toastify/dist/ReactToastify.css";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Obtener parámetros de la URL
    const collectionStatus = searchParams.get('collection_status');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');
    
    // Verificar si el pago fue exitoso
    if (collectionStatus === 'approved' && status === 'approved') {
      // Mostrar toast de éxito
      toast.success("¡Pago realizado correctamente!", { 
        theme: "colored",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Extraer el ID del meet del external_reference (user_X_meet_Y o club_X_meet_Y_...)
      if (externalReference) {
        const meetIdMatch = externalReference.match(/meet_(\d+)/);
        if (meetIdMatch) {
          const meetId = meetIdMatch[1];
          const isClub = externalReference.startsWith('club_');
          navigate(isClub ? `/club/meet/${meetId}` : `/meet/${meetId}`, { replace: true });
          return;
        }
      }
    } else {
      // Si el pago no fue exitoso, mostrar error
      toast.error("El pago no se pudo procesar correctamente", { 
        theme: "colored",
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
    
    // Si no se puede determinar el meet, redirigir según origen (club o atleta)
    const isClub = externalReference?.startsWith('club_');
    navigate(isClub ? '/club/meets' : '/meets', { replace: true });
  }, [navigate, searchParams]);

  // Mostrar loading mientras se procesa la redirección
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Procesando pago...
    </div>
  );
}
