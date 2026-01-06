import { useState } from "react";
import { toast } from "material-react-toastify";
import { makeRequest } from "../config/axios";
import { COLORS } from "../constants/theme";
import Icon from "../constants/Icon";
import "./styles/forgotPasswordModal.scss";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: input, 2: success
  const [censoredEmail, setCensoredEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setIdentifier("");
    setIsSubmitting(false);
    setStep(1);
    setCensoredEmail("");
    setTestPassword("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      toast.error("Por favor ingresa tu email o DNI", { theme: "colored" });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await makeRequest.post("/auth/forgot-password", {
        identifier: identifier.trim()
      });

      // Si está en modo TEST, mostrar contraseña directamente
      if (response.data.testMode && response.data.password) {
        setTestPassword(response.data.password);
        if (response.data.censoredEmail) {
          setCensoredEmail(response.data.censoredEmail);
        }
        setStep(2);
        toast.success("Credenciales obtenidas (modo TEST)", { theme: "colored" });
      } else {
        // Si la respuesta incluye email censurado (se ingresó DNI)
        if (response.data.censoredEmail) {
          setCensoredEmail(response.data.censoredEmail);
        }
        setStep(2);
        toast.success("¡Credenciales enviadas!", { theme: "colored" });
      }
    } catch (error) {
      const errorMessage = error.response?.data || "Ocurrió un error. Por favor intenta nuevamente.";
      toast.error(errorMessage, { theme: "colored" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isSubmitting && step === 1) {
      handleSubmit();
    }
  };

  return (
    <div className="forgotPasswordModal-overlay" onClick={handleClose}>
      <div className="forgotPasswordModal-container" onClick={(e) => e.stopPropagation()}>
        <button className="forgotPasswordModal-closeBtn" onClick={handleClose}>
          <Icon name="close" size={24} color={COLORS.black_01} />
        </button>

        {step === 1 ? (
          <>
            <div className="forgotPasswordModal-icon">
              <Icon name="lock" size={32} color={COLORS.blue_01} />
            </div>

            <h2 className="forgotPasswordModal-title">Olvidé mi contraseña</h2>
            <p className="forgotPasswordModal-subtitle">
              Ingresa tu email o DNI y te enviaremos tus credenciales de acceso al correo electrónico asociado a tu cuenta.
            </p>

            <div className="forgotPasswordModal-inputContainer">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Email o DNI"
                className="forgotPasswordModal-input"
                autoFocus
                disabled={isSubmitting}
                autoCapitalize="none"
                spellCheck={false}
                autoCorrect="none"
              />
            </div>

            <button
              className="forgotPasswordModal-submitBtn"
              onClick={handleSubmit}
              disabled={isSubmitting || !identifier.trim()}
            >
              {isSubmitting ? (
                <div className="forgotPasswordModal-loader"></div>
              ) : (
                <span>Enviar credenciales</span>
              )}
            </button>

            <div className="forgotPasswordModal-info">
              <Icon name="info" size={16} color={COLORS.gray_01} />
              <p>Si ingresaste tu DNI, te mostraremos el email donde enviamos las credenciales.</p>
            </div>
          </>
        ) : (
          <>
            <div className="forgotPasswordModal-successIcon">
              <Icon name="check" size={48} color={COLORS.green_01} />
            </div>

            {testPassword ? (
              <>
                <h2 className="forgotPasswordModal-title">Credenciales obtenidas</h2>
                <p className="forgotPasswordModal-subtitle">
                  Modo TEST activado - Contraseña obtenida directamente
                </p>

                {censoredEmail && (
                  <div className="forgotPasswordModal-emailInfo">
                    <Icon name="mail" size={20} color={COLORS.blue_01} />
                    <p>Email: <strong>{censoredEmail}</strong></p>
                  </div>
                )}

                <div className="forgotPasswordModal-credentials">
                  <div className="forgotPasswordModal-credentialItem">
                    <span className="forgotPasswordModal-credentialLabel">Contraseña:</span>
                    <div className="forgotPasswordModal-credentialValue">{testPassword}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="forgotPasswordModal-title">¡Credenciales enviadas!</h2>
                <p className="forgotPasswordModal-subtitle">
                  Hemos enviado tus credenciales de acceso a tu correo electrónico.
                </p>

                {censoredEmail && (
                  <div className="forgotPasswordModal-emailInfo">
                    <Icon name="mail" size={20} color={COLORS.blue_01} />
                    <p>Enviado a: <strong>{censoredEmail}</strong></p>
                  </div>
                )}

                <div className="forgotPasswordModal-instructions">
                  <p>📧 Revisa tu bandeja de entrada</p>
                  <p>📂 Si no lo encuentras, verifica la carpeta de spam</p>
                  <p>🔐 Por tu seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión</p>
                </div>
              </>
            )}

            <button
              className="forgotPasswordModal-submitBtn"
              onClick={handleClose}
            >
              <span>Entendido</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

