import "material-react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "material-react-toastify";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../config/axios";
import { useEffect, useState } from "react";
import { COLORS, SIZES } from "../constants/theme";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import Select from "react-select";
import federationOptions from "../json/federations.json";
import nationalityOptions from "../json/nationalities.json";

const selectStyles = {
  container: (base) => ({
    ...base,
    minWidth: "100%",
    width: "100%",
  }),
  control: (base, state) => {
    const hasError = state.selectProps.className?.includes("error-select");
    return {
      ...base,
      backgroundColor: COLORS.white_01,
      borderColor: hasError 
        ? COLORS.red_01 
        : state.isFocused 
          ? COLORS.blue_01 
          : COLORS.black_01,
      borderWidth: state.isFocused || hasError ? 2 : 1,
      padding: "0",
      height: "48px",
      minHeight: "48px",
      maxHeight: "48px",
      boxShadow: "none",
      minWidth: "100%",
      borderRadius: "8px",
      outline: "none",
      width: "100%",
      display: "flex",
      alignItems: "center",
      "&:hover": {
        borderColor: hasError ? COLORS.red_01 : COLORS.blue_01,
      },
    };
  },
  valueContainer: (base) => ({
    ...base,
    justifyContent: "flex-start",
    alignItems: "center",
    flexWrap: "nowrap",
    padding: "0 16px",
    height: "48px",
    margin: 0,
    gap: 0,
  }),
  singleValue: (base) => ({
    ...base,
    color: COLORS.black_01,
    fontWeight: 600,
    fontSize: SIZES.f5,
    margin: 0,
    padding: 0,
    lineHeight: "48px",
    position: "relative",
    top: 0,
    transform: "none",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: COLORS.black_01,
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "48px",
  }),
  placeholder: (base) => ({
    ...base,
    color: COLORS.gray_01,
    fontSize: SIZES.f5,
    fontWeight: 600,
    margin: 0,
    padding: 0,
    lineHeight: "48px",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  menu: (base) => ({
    ...base,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    border: `1px solid ${COLORS.black_01}`,
    backgroundColor: COLORS.white_01,
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: 1000,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? COLORS.blue_01 : COLORS.white_01,
    color: state.isFocused ? COLORS.white_01 : COLORS.black_01,
    fontWeight: 600,
    fontSize: SIZES.f5,
    padding: "8px 12px",
    cursor: "pointer",
    ":active": {
      backgroundColor: COLORS.blue_01,
      color: COLORS.white_01,
    }
  }),
};

export function Register() {
  useEffect(() => {import("./styles/register.scss")}, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nationality, setNationality] = useState(null);
  const [email, setEmail] = useState("");
  const [federation, setFederation] = useState(null);
  const [gender, setGender] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { setLogin } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (isSubmitting) return;

    // Resetear errores
    const newErrors = {};

    // Validación básica
    if (!fullName.trim()) {
      newErrors.fullName = true;
    }
    if (!dni.trim()) {
      newErrors.dni = true;
    }
    if (!birthDate) {
      newErrors.birthDate = true;
    }
    if (!nationality) {
      newErrors.nationality = true;
    }
    if (!email.trim()) {
      newErrors.email = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = true;
    }
    if (!federation) {
      newErrors.federation = true;
    }
    if (!gender) {
      newErrors.gender = true;
    }
    if (!password.trim()) {
      newErrors.password = true;
    } else if (password.length < 6) {
      newErrors.password = true;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = true;
    }

    // Si hay errores, marcarlos y mostrar mensaje
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor completa todos los campos correctamente", { theme: "colored" });
      return;
    }

    // Limpiar errores si todo está bien
    setErrors({});

    setIsSubmitting(true);
    try {
      // Formatear fecha de nacimiento: HTML date input devuelve YYYY-MM-DD
      // El backend espera DD-MM-YYYY según el código en auth.js
      const [year, month, day] = birthDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      // Preparar datos para el backend
      // Nota: El backend actual espera username, email, password, name, born
      // Adaptamos los datos según lo que el backend pueda recibir
      const newUser = {
        username: email, // Usamos email como username
        email: email,
        password: password,
        name: fullName,
        born: formattedDate,
        dni: dni,
        nationality: nationality?.value || null,
        federation: federation?.value || null,
        gender: gender?.value || null,
      };

      const formData = new FormData();
      formData.append("newUser", JSON.stringify(newUser));

      const res = await makeRequest.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Registro exitoso", { theme: "colored" });
      
      // Intentar login automático después del registro
      try {
        const loginRes = await makeRequest.post("/auth/login", { 
          credentials: JSON.stringify({user: email, password: password}) 
        });
        await setLogin(loginRes.data.user, loginRes.data.token);
        navigate("/");
      } catch (loginErr) {
        // Si el login automático falla, redirigir a login
        navigate("/login");
      }
    } catch (err) {
      const errorMessage = err.response?.data || "Ocurrió un error al registrar";
      toast.error(errorMessage, { theme: "colored" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="Register">
      <NavBar />

      <main>
        <div id="registerForm">
          <div id="logoContainer">
            <Icon name="fam" size={40} color={COLORS.white_01}/>
          </div>

          <h2>Crear cuenta en webfam</h2>
          <p id="subTitle">Completa tus datos para registrarte y acceder a tu panel de atleta, marcas, inscripciones y mucho más.</p>

          <div className="formSection">
            <span className="sectionLabel">Información Personal</span>
            <input 
              className={errors.fullName ? "error" : ""}
              value={fullName} 
              onChange={e => {
                setFullName(e.target.value);
                if (errors.fullName) {
                  setErrors(prev => ({ ...prev, fullName: false }));
                }
              }} 
              autoCapitalize="words" 
              spellCheck={false} 
              placeholder="Nombre completo"
              disabled={isSubmitting}
            />

            <input 
              className={errors.dni ? "error" : ""}
              value={dni} 
              onChange={e => {
                setDni(e.target.value.replace(/\D/g, ""));
                if (errors.dni) {
                  setErrors(prev => ({ ...prev, dni: false }));
                }
              }} 
              autoCapitalize="none" 
              spellCheck={false} 
              placeholder="DNI"
              maxLength={20}
              disabled={isSubmitting}
            />

            <div className={`dateInputWrapper ${errors.birthDate ? "error" : ""}`}>
              <input 
                type="date"
                id="birthDate"
                className={errors.birthDate ? "error" : ""}
                value={birthDate} 
                onChange={e => {
                  const selectedDate = e.target.value;
                  const today = new Date().toISOString().split('T')[0];
                  // Solo permitir fechas que no sean futuras
                  if (selectedDate <= today) {
                    setBirthDate(selectedDate);
                    if (errors.birthDate) {
                      setErrors(prev => ({ ...prev, birthDate: false }));
                    }
                  } else {
                    toast.error("No puedes seleccionar una fecha futura", { theme: "colored" });
                  }
                }} 
                placeholder="Fecha de nacimiento"
                disabled={isSubmitting}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              {!birthDate && (
                <label htmlFor="birthDate" className="datePlaceholder">
                  Fecha de nacimiento
                </label>
              )}
              {/* <button 
                type="button"
                className="datePickerButton"
                onClick={() => document.getElementById('birthDate')?.showPicker?.() || document.getElementById('birthDate')?.click()}
                disabled={isSubmitting}
                aria-label="Seleccionar fecha"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.66667 2.5V5.83333M13.3333 2.5V5.83333M4.16667 9.16667H15.8333M4.16667 4.16667H15.8333C16.7538 4.16667 17.5 4.91286 17.5 5.83333V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V5.83333C2.5 4.91286 3.24619 4.16667 4.16667 4.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button> */}
            </div>

            <Select
              className={errors.nationality ? "error-select" : ""}
              options={nationalityOptions}
              onChange={(value) => {
                setNationality(value);
                if (errors.nationality) {
                  setErrors(prev => ({ ...prev, nationality: false }));
                }
              }}
              value={nationality}
              styles={selectStyles}
              placeholder="Nacionalidad"
              isDisabled={isSubmitting}
              isSearchable={true}
            />

            <Select
              className={errors.gender ? "error-select" : ""}
              options={[{ value: 1, label: "Masculino" }, { value: 2, label: "Femenino" }]}
              onChange={(value) => {
                setGender(value);
                if (errors.gender) {
                  setErrors(prev => ({ ...prev, gender: false }));
                }
              }}
              value={gender}
              styles={selectStyles}
              placeholder="Género"
              isDisabled={isSubmitting}
              isSearchable={false}
            />
          </div>

          <div className="formSection">
            <span className="sectionLabel">Contacto y Afiliación</span>
            <input 
              className={errors.email ? "error" : ""}
              type="email"
              value={email} 
              onChange={e => {
                setEmail(e.target.value.toLowerCase());
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: false }));
                }
              }} 
              autoCapitalize="none" 
              spellCheck={false} 
              autoCorrect="none" 
              placeholder="Email"
              disabled={isSubmitting}
            />

            <Select
              className={errors.federation ? "error-select" : ""}
              options={federationOptions}
              onChange={(value) => {
                setFederation(value);
                if (errors.federation) {
                  setErrors(prev => ({ ...prev, federation: false }));
                }
              }}
              value={federation}
              styles={selectStyles}
              placeholder="Federación"
              isDisabled={isSubmitting}
              isSearchable={false}
            />
          </div>

          <div className="formSection">
            <span className="sectionLabel">Seguridad</span>
            <input 
              className={errors.password ? "error" : ""}
              type="password"
              value={password} 
              onChange={e => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: false }));
                }
                // Si las contraseñas coinciden, limpiar error de confirmación
                if (e.target.value === confirmPassword && errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: false }));
                }
              }} 
              autoCapitalize="none" 
              spellCheck={false} 
              autoCorrect="none" 
              placeholder="Contraseña"
              disabled={isSubmitting}
            />

            <input 
              className={errors.confirmPassword ? "error" : ""}
              type="password"
              value={confirmPassword} 
              onChange={e => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: false }));
                }
              }} 
              autoCapitalize="none" 
              spellCheck={false} 
              autoCorrect="none" 
              placeholder="Confirmar contraseña"
              disabled={isSubmitting}
            />
          </div>

          <button id="registerButton" onClick={handleRegister} disabled={isSubmitting}>
            <p>{isSubmitting ? "REGISTRANDO..." : "REGISTRARSE"}</p>
          </button>

          <div id="notAccountContainer">
            <div className="lineSeparator"/>
            <p>ya tenes cuenta?</p>
            <div className="lineSeparator"/>
          </div>

          <button id="loginButton" onClick={() => navigate("/login")} disabled={isSubmitting}>
            <p>Iniciar Sesion</p>
          </button>
          
          <a href="mailto:info@webfam.com.ar">Problemas al crear cuenta?</a>
        </div>
      </main>
    </div>
  );
}

export default Transition(Register);