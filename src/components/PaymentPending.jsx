import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "material-react-toastify";
import "material-react-toastify/dist/ReactToastify.css";

export default function PaymentPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const externalReference = searchParams.get('external_reference');

    toast.info("Tu pago está pendiente. Te avisaremos cuando se acredite.", {
      theme: "colored",
      position: "top-right",
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });

    if (externalReference) {
      const meetIdMatch = externalReference.match(/meet_(\d+)/);
      if (meetIdMatch) {
        const meetId = meetIdMatch[1];
        const isClub = externalReference.startsWith('club_');
        navigate(isClub ? `/club/meet/${meetId}` : `/meet/${meetId}`, { replace: true });
        return;
      }
    }
    const isClub = externalReference?.startsWith('club_');
    navigate(isClub ? '/club/meets' : '/meets', { replace: true });
  }, [navigate, searchParams]);

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
