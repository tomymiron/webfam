import "material-react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";
import { useAuthClub } from "../contexts/AuthContextClub";
import { toast } from "material-react-toastify";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../config/axios";
import { useEffect, useState } from "react";
import { COLORS } from "../constants/theme";
import NavBar from "../components/NavBar";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import Transition from "../Transition";
import Icon from "../constants/Icon";

export function Login() {
  useEffect(() => {import("./styles/login.scss")}, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const { setLogin: setAthleteLogin } = useAuth();
  const { setLogin: setClubLogin } = useAuthClub();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Intentar login como atleta
      const res = await makeRequest.post("/auth/login", { 
        credentials: JSON.stringify({user: user, password: pass}) 
      });
      
      toast.success("Ingreso exitoso", { theme: "colored" });
      await setAthleteLogin(res.data.user, res.data.token);
      navigate("/athlete");
      
    } catch(athleteErr) {
      // Si falla como atleta, intentar como club
      try {
        const clubRes = await makeRequest.post("/auth/login/club", { 
          credentials: JSON.stringify({email: user, password: pass}) 
        });
        
        toast.success("Ingreso exitoso - Club", { theme: "colored" });
        await setClubLogin(clubRes.data.club, clubRes.data.token);
        navigate("/club");
        
      } catch(clubErr) {
        // Si ambos fallan, mostrar error
        toast.error(athleteErr.response?.data || "Usuario o contraseña incorrectos", { theme: "colored" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div id="Login">

      <NavBar />

      <main>
        <div id="loginForm">
          <div id="logoContainer">
            <Icon name="fam" size={40} color={COLORS.white_01}/>
          </div>

          <h2>Inicia sesion en webfam</h2>
          <p id="subTitle">Panel de atleta, ingresa para poder acceder a tus datos, marcas, inscripciones y mucho mas.</p>

          <input value={user} onChange={e => setUser(e.target.value)} autoCapitalize="none" spellCheck={false} autoCorrect="none" placeholder="Email o DNI"/>
          <input value={pass} onChange={e => setPass(e.target.value)} autoCapitalize="none" spellCheck={false} autoCorrect="none" placeholder="Contraseña"/>

          <button id="loginButton" onClick={handleLogin} disabled={isSubmitting}>
            <p>{isSubmitting ? "INGRESANDO..." : "INGRESAR"}</p>
          </button>

          <div id="notAccountContainer">
            <div className="lineSeparator"/>
            <p>no tenes cuenta?</p>
            <div className="lineSeparator"/>
          </div>

          <button id="registerButton" onClick={() => navigate("/register")}>
            <p>Crear Cuenta</p>
          </button>
          
          <button 
            id="forgotPasswordButton" 
            onClick={() => setShowForgotPasswordModal(true)}
          >
            Olvidé mi contraseña
          </button>
        </div>
      </main>

      <ForgotPasswordModal 
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}

export default Transition(Login);