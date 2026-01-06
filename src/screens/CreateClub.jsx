import "material-react-toastify/dist/ReactToastify.css";
import { toast } from "material-react-toastify";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../config/axios";
import { useEffect, useState, useRef } from "react";
import { COLORS } from "../constants/theme";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useAuthClub } from "../contexts/AuthContextClub";

export function CreateClub() {
  useEffect(() => {import("./styles/createClub.scss")}, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const { setClubLogin } = useAuthClub();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor selecciona un archivo de imagen", { theme: "colored" });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede ser mayor a 5MB", { theme: "colored" });
        return;
      }

      setImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRegister = async () => {
    if (isSubmitting) return;

    // Resetear errores
    const newErrors = {};

    // Validación básica
    if (!name.trim()) {
      newErrors.name = true;
    } else if (name.trim().length > 50) {
      newErrors.name = true;
      toast.error("El nombre no puede tener más de 50 caracteres", { theme: "colored" });
      return;
    }

    if (!alias.trim()) {
      newErrors.alias = true;
    } else if (alias.trim().length > 15) {
      newErrors.alias = true;
      toast.error("El alias no puede tener más de 15 caracteres", { theme: "colored" });
      return;
    } else if (/\s/.test(alias.trim())) {
      newErrors.alias = true;
      toast.error("El alias no puede contener espacios", { theme: "colored" });
      return;
    }

    if (!email.trim()) {
      newErrors.email = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = true;
    }

    if (!password.trim()) {
      newErrors.password = true;
    } else if (password.length < 6) {
      newErrors.password = true;
      toast.error("La contraseña debe tener al menos 6 caracteres", { theme: "colored" });
      return;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = true;
      toast.error("Las contraseñas no coinciden", { theme: "colored" });
      return;
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
      // Preparar datos para el backend
      const newClub = {
        name: name.trim(),
        alias: alias.trim().toUpperCase(),
        email: email.toLowerCase().trim(),
        password: password,
      };

      const formData = new FormData();
      formData.append("newClub", JSON.stringify(newClub));
      
      if (image) {
        formData.append("image", image);
      }

      const res = await makeRequest.post("/auth/register/club", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Club registrado exitosamente", { theme: "colored" });
      
      // Intentar login automático después del registro
      try {
        const loginRes = await makeRequest.post("/auth/login/club", { 
          credentials: JSON.stringify({email: email.toLowerCase().trim(), password: password}) 
        });
        await setClubLogin(loginRes.data.club, loginRes.data.token);
        navigate("/club");
      } catch (loginErr) {
        // Si el login automático falla, redirigir a login
        toast.info("Por favor inicia sesión con tu nuevo club", { theme: "colored" });
        navigate("/login");
      }
    } catch (err) {
      const errorMessage = err.response?.data || "Ocurrió un error al registrar el club";
      toast.error(errorMessage, { theme: "colored" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="CreateClub">
      <NavBar />

      <main>
        <div id="createClubForm">
          <div id="logoContainer">
            <Icon name="fam" size={40} color={COLORS.white_01}/>
          </div>

          <h2>Crear club en webfam</h2>
          <p id="subTitle">Completa los datos para registrar tu club y acceder al panel de administración.</p>

          <div className="formSection">
            <span className="sectionLabel">Información del Club</span>
            <input 
              className={errors.name ? "error" : ""}
              value={name} 
              onChange={e => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: false }));
                }
              }} 
              autoCapitalize="words" 
              spellCheck={false} 
              placeholder="Nombre del club"
              maxLength={50}
              disabled={isSubmitting}
            />

            <input 
              className={errors.alias ? "error" : ""}
              value={alias} 
              onChange={e => {
                // Convertir a mayúsculas y eliminar espacios
                const value = e.target.value.toUpperCase().replace(/\s/g, '');
                setAlias(value);
                if (errors.alias) {
                  setErrors(prev => ({ ...prev, alias: false }));
                }
              }} 
              autoCapitalize="characters" 
              spellCheck={false} 
              placeholder="Alias (máx. 15 caracteres, sin espacios)"
              maxLength={15}
              disabled={isSubmitting}
            />

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
          </div>

          <div className="formSection">
            <span className="sectionLabel">Imagen del Club (Opcional)</span>
            <div className="imageUploadContainer">
              {imagePreview ? (
                <div className="imagePreview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button"
                    className="removeImageButton"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                  >
                    <Icon name="close" size={20} color={COLORS.white_01} />
                  </button>
                </div>
              ) : (
                <label className="imageUploadLabel">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    style={{ display: 'none' }}
                  />
                  <div className="imageUploadPlaceholder">
                    <div className="imageIcon">📷</div>
                    <p>Haz clic para subir una imagen</p>
                    <span>Máximo 5MB</span>
                  </div>
                </label>
              )}
            </div>
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

          <button id="createClubButton" onClick={handleRegister} disabled={isSubmitting}>
            <p>{isSubmitting ? "REGISTRANDO..." : "CREAR CLUB"}</p>
          </button>

          <div id="notAccountContainer">
            <div className="lineSeparator"/>
            <p>ya tenes un club?</p>
            <div className="lineSeparator"/>
          </div>

          <button id="loginButton" onClick={() => navigate("/login")} disabled={isSubmitting}>
            <p>Iniciar Sesion</p>
          </button>
          
          <a href="mailto:info@webfam.com.ar">Problemas al crear club?</a>
        </div>
      </main>
    </div>
  );
}

export default Transition(CreateClub);










