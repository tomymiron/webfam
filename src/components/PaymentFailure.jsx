import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "material-react-toastify";
import "material-react-toastify/dist/ReactToastify.css";

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Obtener parámetros de la URL
    const externalReference = searchParams.get('external_reference');
    
    // Mostrar toast de error
    toast.error("El pago fue cancelado o no se pudo procesar", { 
      theme: "colored",
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
    
    // Extraer el ID del meet del external_reference (formato: user_X_meet_Y)
    if (externalReference) {
      console.log('external_reference (failure):', externalReference);
      const meetIdMatch = externalReference.match(/meet_(\d+)/);
      if (meetIdMatch) {
        const meetId = meetIdMatch[1];
        // Redirigir al meet específico
        navigate(`/meet/${meetId}`, { replace: true });
        return;
      }
    }
    // Si no se puede determinar el meet específico, redirigir a la lista de meets
    navigate('/meets', { replace: true });
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
      Procesando...
    </div>
  );
}
