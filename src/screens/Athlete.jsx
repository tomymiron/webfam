import AthleteResultItem from "../components/results/AthleteResultItem";
import { profileImageGetter, certImageGetter, receiptImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import "material-react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "material-react-toastify";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import Select from 'react-select';


function Athlete() {
  useEffect(() => {import("./styles/athlete.scss")}, []);

  const { logout, authState, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [isLoadingCert, setIsLoadingCert] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);
  
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [prices, setPrices] = useState({ affiliation: null, revalidation: null });
  
  const [bestResults, setBestResults] = useState([]);
  const [latestResults, setLatestResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  // Estados para edición de perfil
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);

  const athlete = authState.user;

  // Actualizar datos del usuario al cargar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authState?.token || !authState?.authenticated) {
        setIsLoadingUser(false);
        return;
      }

      try {
        const res = await makeRequest.get("/auth/me", {
          headers: { Authorization: authState.token }
        });
        
        if (res.data?.user) {
          await updateUser(res.data.user);
        }
      } catch (err) {
        console.log("Error al actualizar datos del usuario:", err);
        // No mostrar error al usuario, solo loguear
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [authState?.token, authState?.authenticated, updateUser]);

  // Inicializar email cuando se carga el atleta
  useEffect(() => {
    if (athlete?.email && !isEditingEmail) {
      setNewEmail(athlete.email);
    }
  }, [athlete?.email, isEditingEmail]);

  // Cargar certificado médico del usuario
  useEffect(() => {
    const fetchCertificate = async () => {
      if (!authState?.token || !authState?.authenticated) {
        setIsLoadingCert(false);
        return;
      }

      try {
        const res = await makeRequest.get("/users/own/cert", {
          headers: { Authorization: authState.token }
        });
        
        if (res.data?.certificate) {
          setCertificate(res.data.certificate);
        }
      } catch (err) {
        console.log("Error al cargar certificado:", err);
      } finally {
        setIsLoadingCert(false);
      }
    };

    fetchCertificate();
  }, [authState?.token, authState?.authenticated]);

  // Cargar recibo de afiliación/revalida del usuario
  useEffect(() => {
    const fetchReceipt = async () => {
      if (!authState?.token || !authState?.authenticated) {
        setIsLoadingReceipt(false);
        return;
      }

      try {
        const res = await makeRequest.get("/users/own/receipt", {
          headers: { Authorization: authState.token }
        });
        
        if (res.data?.receipt) {
          setReceipt(res.data.receipt);
        }
      } catch (err) {
        console.log("Error al cargar recibo:", err);
      } finally {
        setIsLoadingReceipt(false);
      }
    };

    fetchReceipt();
  }, [authState?.token, authState?.authenticated]);

  // Cargar transferencias del atleta usando React Query
  const { data: transfers = [], isLoading: isLoadingTransfers } = useQuery({
    queryFn: () => makeRequest.get("/transfers/athlete", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data || []),
    queryKey: ["athleteTransfers"],
    enabled: !!authState?.token && !!authState?.authenticated,
  });

  // Cargar precios de afiliación y revalida
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await makeRequest.get("/users/prices?ids=10,11");
        
        if (res.data?.prices) {
          const pricesData = res.data.prices;
          const revalidation = pricesData.find(p => p.id === 10);
          const affiliation = pricesData.find(p => p.id === 11);
          
          setPrices({
            revalidation: revalidation ? revalidation.price : null,
            affiliation: affiliation ? affiliation.price : null
          });
        }
      } catch (err) {
        console.log("Error al cargar precios:", err);
      }
    };

    fetchPrices();
  }, []);

  // Cargar mejores marcas y últimas marcas
  useEffect(() => {
    const fetchResults = async () => {
      if (!authState?.token || !authState?.authenticated) {
        setIsLoadingResults(false);
        return;
      }

      try {
        const [bestRes, latestRes] = await Promise.all([
          makeRequest.get("/users/results/best", {
            headers: { Authorization: authState.token }
          }),
          makeRequest.get("/users/results/latest", {
            headers: { Authorization: authState.token }
          })
        ]);
        
        if (bestRes.data?.results) {
          setBestResults(bestRes.data.results);
        }
        
        if (latestRes.data?.results) {
          setLatestResults(latestRes.data.results);
        }
      } catch (err) {
        console.log("Error al cargar resultados:", err);
      } finally {
        setIsLoadingResults(false);
      }
    };

    fetchResults();
  }, [authState?.token, authState?.authenticated]);

  // Query para obtener años disponibles con resultados
  const { data: availableYearsData, isLoading: isLoadingYears } = useQuery({
    queryFn: () => makeRequest.get("/users/own/years", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["user-years"],
    enabled: !!authState?.authenticated,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener mejores marcas de un año específico
  const { data: yearResultsData, refetch: refetchYearResults } = useQuery({
    queryKey: ['user-year-results', selectedYear],
    queryFn: async () => {
      if (!selectedYear) return [];
      const response = await makeRequest.get(`/users/own/year/${selectedYear}`, {
        headers: { Authorization: authState?.token }
      });
      return response.data.results || [];
    },
    enabled: !!authState?.authenticated && !!selectedYear,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleLogout = () => {
    toast.success("Cerrando sesion...", { theme: "colored" });
    navigate("/login");
    logout();
  }

  const handleRequestClubAssociation = () => {
    navigate("/clubs/request");
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Solo se permiten archivos de imagen (JPEG, PNG) o PDF", { theme: "colored" });
        return;
      }
      
      // Validar tamaño (máximo 4MB)
      if (file.size > 4 * 1024 * 1024) {
        toast.error("El archivo no debe superar los 4MB", { theme: "colored" });
        return;
      }
      
      setSelectedFile(file);
    }
  }

  const handleUploadCertificate = async () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo", { theme: "colored" });
      return;
    }

    setIsUploadingCert(true);
    
    try {
      const formData = new FormData();
      formData.append('certificate', selectedFile);

      const res = await makeRequest.post("/users/own/cert", formData, {
        headers: {
          Authorization: authState?.token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(res.data?.message || "Certificado médico subido exitosamente", { theme: "colored" });
      setSelectedFile(null);
      
      // Resetear el input de archivo
      const fileInput = document.getElementById('certInput');
      if (fileInput) fileInput.value = '';
      
      // Recargar el certificado
      const certRes = await makeRequest.get("/users/own/cert", {
        headers: { Authorization: authState?.token }
      });
      if (certRes.data?.certificate) {
        setCertificate(certRes.data.certificate);
      }
      
    } catch (err) {
      console.error("Error al subir certificado:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al subir el certificado";
      toast.error(errorMessage, { theme: "colored" });
    } finally {
      setIsUploadingCert(false);
    }
  }

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Solo se permiten archivos de imagen (JPEG, PNG) o PDF", { theme: "colored" });
        return;
      }
      
      // Validar tamaño (máximo 4MB)
      if (file.size > 4 * 1024 * 1024) {
        toast.error("El archivo no debe superar los 4MB", { theme: "colored" });
        return;
      }
      
      setSelectedReceipt(file);
    }
  }

  const handleUploadReceipt = async () => {
    if (!selectedReceipt) {
      toast.error("Por favor selecciona un archivo", { theme: "colored" });
      return;
    }

    setIsUploadingReceipt(true);
    
    try {
      const formData = new FormData();
      formData.append('receipt', selectedReceipt);

      const res = await makeRequest.post("/users/own/receipt", formData, {
        headers: {
          Authorization: authState?.token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(res.data?.message || "Recibo subido exitosamente", { theme: "colored" });
      setSelectedReceipt(null);
      
      // Resetear el input de archivo
      const fileInput = document.getElementById('receiptInput');
      if (fileInput) fileInput.value = '';
      
      // Recargar el recibo
      const receiptRes = await makeRequest.get("/users/own/receipt", {
        headers: { Authorization: authState?.token }
      });
      if (receiptRes.data?.receipt) {
        setReceipt(receiptRes.data.receipt);
      }
      
    } catch (err) {
      console.error("Error al subir recibo:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al subir el recibo";
      toast.error(errorMessage, { theme: "colored" });
    } finally {
      setIsUploadingReceipt(false);
    }
  }

  const handleApproveTransfer = async (transferId) => {
    try {
      await makeRequest.put(`/transfers/athlete/approve/${transferId}`, {}, {
        headers: { Authorization: authState?.token }
      });

      toast.success("Transferencia aprobada exitosamente", { theme: "colored" });
      
      // Invalidar queries relacionadas para actualizar la UI
      queryClient.invalidateQueries(["athleteTransfers"]);
      queryClient.invalidateQueries(["clubSentTransfers"]);
      queryClient.invalidateQueries(["clubReceivedTransfers"]);
      queryClient.invalidateQueries(["adminTransfers"]);
    } catch (err) {
      console.error("Error al aprobar transferencia:", err);
      toast.error(err.response?.data?.message || err.response?.data || "Error al aprobar la transferencia", { theme: "colored" });
    }
  };

  const handleRejectTransfer = async (transferId) => {
    try {
      await makeRequest.put(`/transfers/athlete/reject/${transferId}`, {}, {
        headers: { Authorization: authState?.token }
      });

      toast.success("Transferencia rechazada exitosamente", { theme: "colored" });
      
      // Invalidar queries relacionadas para actualizar la UI
      queryClient.invalidateQueries(["athleteTransfers"]);
      queryClient.invalidateQueries(["clubSentTransfers"]);
      queryClient.invalidateQueries(["clubReceivedTransfers"]);
      queryClient.invalidateQueries(["adminTransfers"]);
    } catch (err) {
      console.error("Error al rechazar transferencia:", err);
      toast.error(err.response?.data?.message || err.response?.data || "Error al rechazar la transferencia", { theme: "colored" });
    }
  };

  const getApprovalStatusLabel = (approved) => {
    if (approved === 1) return "APROBADO";
    if (approved === 0) return "RECHAZADO";
    return "PENDIENTE";
  };

  const getApprovalStatusClass = (approved) => {
    if (approved === 1) return "status-approved";
    if (approved === 0) return "status-rejected";
    return "status-pending";
  };

  // Función para calcular la categoría en un año específico
  const getCategoryForYear = (birthDate, year) => {
    if (!birthDate) return 'N/A';

    // Parsear fecha manualmente para evitar problemas de zona horaria
    const [birthYear] = birthDate.split('-').map(Number);
    const age = year - birthYear;

    // Aplicar reglas de categorías
    if (age >= 23) return 'Mayores';
    if (age >= 20 && age <= 22) return 'U23';
    if (age >= 18 && age <= 19) return 'U20';
    if (age >= 16 && age <= 17) return 'U18';
    if (age >= 14 && age <= 15) return 'U16';
    if (age >= 12 && age <= 13) return 'U14';
    if (age >= 0 && age <= 11) return 'U12';
    return 'N/A';
  };

  // Opciones para el select de años
  const yearOptions = availableYearsData?.years?.map(year => ({
    value: year,
    label: `${year} (${getCategoryForYear(athlete?.born, year)})`
  })) || [];

  // Estilos personalizados para react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      padding: '4px',
      border: `1px solid ${state.isFocused ? '#749AED' : '#7D7D7D'}`,
      borderRadius: '8px',
      backgroundColor: '#EEF0FA',
      fontSize: '16px',
      minHeight: '48px',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(116, 154, 237, 0.1)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#749AED' : '#7D7D7D',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#7D7D7D',
      fontSize: '16px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#171921',
      fontSize: '16px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#749AED' : state.isFocused ? '#EEF0FA' : '#EEF0FA',
      color: state.isSelected ? '#EEF0FA' : '#171921',
      padding: '12px 16px',
      fontSize: '16px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#749AED',
        color: '#EEF0FA',
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      border: '1px solid #7D7D7D',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#EEF0FA',
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '0',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: '#7D7D7D',
      '&:hover': {
        color: '#171921',
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#7D7D7D',
      '&:hover': {
        color: '#171921',
      },
    }),
  };

  // Función para manejar cambio de año
  const handleYearChange = (option) => {
    setSelectedYear(option ? option.value : null);
  };

  // Funciones para edición de perfil
  const handleOpenProfileImageModal = () => {
    setShowProfileImageModal(true);
  };

  const handleCloseProfileImageModal = () => {
    setShowProfileImageModal(false);
    // Limpiar cualquier selección previa si se cancela
    setSelectedProfileImage(null);
    // Resetear el input de archivo
    const fileInput = document.getElementById('profileImageInput');
    if (fileInput) fileInput.value = '';
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error("Solo se permiten archivos de imagen (JPEG, PNG)", { theme: "colored" });
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("El archivo no debe superar los 2MB", { theme: "colored" });
        return;
      }

      setSelectedProfileImage(file);
    }
  };

  const handleConfirmProfileImageSelection = () => {
    if (selectedProfileImage) {
      setShowProfileImageModal(false);
    } else {
      toast.error("Por favor selecciona una imagen primero", { theme: "colored" });
    }
  };

  const handleUploadProfileImage = async () => {
    if (!selectedProfileImage) {
      toast.error("Por favor selecciona una imagen", { theme: "colored" });
      return;
    }

    setIsUploadingProfileImage(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', selectedProfileImage);

      const res = await makeRequest.post("/users/own/profile-image", formData, {
        headers: {
          Authorization: authState?.token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(res.data?.message || "Foto de perfil actualizada exitosamente", { theme: "colored" });
      setSelectedProfileImage(null);

      // Resetear el input de archivo
      const fileInput = document.getElementById('profileImageInput');
      if (fileInput) fileInput.value = '';

      // Actualizar el estado del usuario
      const userRes = await makeRequest.get("/auth/me", {
        headers: { Authorization: authState.token }
      });
      if (userRes.data?.user) {
        await updateUser(userRes.data.user);
      }

    } catch (err) {
      console.error("Error al actualizar foto de perfil:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al actualizar la foto de perfil";
      toast.error(errorMessage, { theme: "colored" });
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast.error("Por favor ingresa un email", { theme: "colored" });
      return;
    }

    try {
      const res = await makeRequest.put("/users/own/email", {
        email: newEmail
      }, {
        headers: { Authorization: authState?.token }
      });

      toast.success(res.data?.message || "Email actualizado exitosamente", { theme: "colored" });

      // Limpiar campos
      setNewEmail('');
      setIsEditingEmail(false);

      // Actualizar el estado del usuario
      const userRes = await makeRequest.get("/auth/me", {
        headers: { Authorization: authState.token }
      });
      if (userRes.data?.user) {
        await updateUser(userRes.data.user);
      }

    } catch (err) {
      console.error("Error al actualizar email:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al actualizar el email";
      toast.error(errorMessage, { theme: "colored" });
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast.error("Por favor ingresa una nueva contraseña", { theme: "colored" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden", { theme: "colored" });
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres", { theme: "colored" });
      return;
    }

    try {
      console.log("Frontend: Attempting to update password");
      console.log("Token present:", authState?.token ? "yes" : "no");
      console.log("New password:", newPassword);

      const res = await makeRequest.post("/users/own/password", {
        newPassword: newPassword
      }, {
        headers: { Authorization: authState?.token }
      });

      console.log("Response received:", res);
      toast.success(res.data?.message || "Contraseña actualizada exitosamente", { theme: "colored" });

      // Limpiar campos
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);

    } catch (err) {
      console.error("Error al actualizar contraseña:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.response?.data || "Error al actualizar la contraseña";
      toast.error(errorMessage, { theme: "colored" });
    }
  };

  if(!athlete || isLoadingUser) {
    return <div>Cargando...</div>
  }

  // Determinar el estado del club
  const hasClub = athlete?.club || athlete?.club_id;
  const hasFederation = athlete?.federation != null && athlete?.federation !== 0;
  // Mostrar certificado médico solo si NO está federado con FAM (federación 1)
  const showCertificate = athlete?.federation != 1;

  return (
    <div id="Athlete">
      <NavBar />

      <main>
        <section>

          <div id="athleteInfo">
            <div id="athleteInfoHeader">
              <div id="athleteImage" onClick={() => setShowImagePickerModal(true)} style={{ cursor: 'pointer' }}>
                <img src={profileImageGetter(athlete?.image)} alt="Athlete" />
                <div className="imageOverlay">
                  <Icon name="note-edit" size={20} color={COLORS.white_01} />
                </div>
              </div>
              <div id="subAthleteInfoHeader">
                <h2>{athlete?.name?.toUpperCase()}</h2>
                <div className="lineSeparator" />
                <p>{athlete?.born}</p>
              </div>
            </div>

            <div id="athleteInfoBody">
              <p>Atleta {categoryGetter(athlete?.born)}</p>
              <button className="red" onClick={handleLogout}>CERRAR SESION</button>
            </div>

            {/* Email section */}
            <div id="emailSection">
              <div id="emailDisplay">
                {!isEditingEmail &&<span id="emailLabel">Email:</span>}
                {isEditingEmail ? (
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Nuevo email"
                    id="emailInput"
                  />
                ) : (
                  <span id="emailValue">{athlete?.email}</span>
                )}
                <button
                  id="editEmailButton"
                  onClick={() => {
                    if (isEditingEmail) {
                      handleUpdateEmail();
                    } else {
                      setNewEmail(athlete?.email || '');
                      setIsEditingEmail(true);
                    }
                  }}
                  disabled={isEditingEmail && !newEmail}
                >
                  {isEditingEmail ? 'GUARDAR' : 'EDITAR'}
                </button>
                {isEditingEmail && (
                  <button
                    id="cancelEmailButton"
                    onClick={() => {
                      setIsEditingEmail(false);
                      setNewEmail('');
                    }}
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            </div>

            {/* Password section */}
            <div id="passwordSection">
              <button
                id="changePasswordButton"
                onClick={() => setIsEditingPassword(!isEditingPassword)}
              >
                CAMBIAR CONTRASEÑA
              </button>
              {isEditingPassword && (
                <div id="passwordEdit">
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <div id="passwordButtonsRow">
                    <button
                      className="updateButton"
                      onClick={handleUpdatePassword}
                      disabled={!newPassword || !confirmPassword}
                    >
                      ACTUALIZAR CONTRASEÑA
                    </button>
                    <button
                      id="cancelPasswordButton"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      CANCELAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>


          {hasClub && (
          <div id="clubInfo">
            <h4>Mi Club</h4>
            <div id="clubInfoHeader">
              <div id="clubImage">
                <img src={profileImageGetter(athlete?.club_image)} alt="Club" />
              </div>
              <div id="subClubInfoHeader">
                <h2>{athlete?.club_name?.toUpperCase()}</h2>
                <div className="lineSeparator" />
                <p>Club</p>
              </div>
            </div>
          </div>
          )}

          {/* Caso 3: Usuario está federado pero no tiene club - mostrar botón de solicitud */}
          {!hasClub && hasFederation && (
            <div id="clubInfo">
              <h4>Mi Club</h4>
              <div id="clubRequestContainer">
                <div id="clubRequestIconSection">
                  <Icon name="users-group" size={48} color={COLORS.white_01} />
                </div>
                <div id="clubRequestContent">
                  <h3>Asociate a un club</h3>
                  <p>Busca y envia una solicitud para vincularte en un club.</p>
                  <button onClick={handleRequestClubAssociation}>
                    BUSCAR CLUB
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Caso 2: Usuario no está federado - no mostrar nada (no se renderiza nada) */}
          <div id="lastResultsContainer">
            <h4>Ultimas Marcas</h4>
            {isLoadingResults ? (
              <p>Cargando...</p>
            ) : latestResults.length > 0 ? (
              latestResults.map((result) =>
                <AthleteResultItem
                  key={result.id}
                  event={result.discipline_name}
                  unit={result.unit}
                  result={result.result}
                  date={result.date}
                  location={result.place_name}
                  wind={result.wind}
                  weight={result.weight}
                  weightLabel={result.weight_label}
                  isWind={result.isWind}
                  isWeight={result.isWeight}
                />
              )
            ) : (
              <p style={{opacity: 0.7}}>No hay marcas registradas</p>
            )}
          </div>



        </section>

        <section>
          {showCertificate && (
            <>
              <h4>Certificado Médico</h4>
              <div id="certUploadContainer">
            {isLoadingCert ? (
              <div id="certUploadContent">
                <p>Cargando...</p>
              </div>
            ) : (
              <>
                {certificate ? (
                  <div id="certUploadContent">
                    <div id="certCurrentFile">
                      <div id="certFileInfo">
                        <div 
                          id="certPreview" 
                          onClick={() => setShowCertModal(true)}
                          className="certPreviewClickable"
                        >
                          {certImageGetter(certificate.file) ? (
                            (() => {
                              const ext = certificate.file.toLowerCase().split('.').pop();
                              const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
                              const isPdf = ext === 'pdf';
                              
                              if (isImage) {
                                return (
                                  <img 
                                    src={certImageGetter(certificate.file)} 
                                    alt="Certificado médico"
                                    className="certPreviewImage"
                                  />
                                );
                              } else if (isPdf) {
                                return (
                                  <iframe 
                                    src={certImageGetter(certificate.file)}
                                    className="certPreviewPdf"
                                    title="Preview certificado PDF"
                                  />
                                );
                              }
                              return null;
                            })()
                          ) : (
                            <Icon name="note-edit" size={32} color={COLORS.blue_01} />
                          )}
                        </div>
                        <div id="certFileDetails">
                          <p className="certFileName">{certificate.file}</p>
                          <p className="certFileDate">Subido: {new Date(certificate.updated_at).toLocaleDateString('es-AR')}</p>
                          <p className="certClickHint">Click para ver más grande</p>
                          <div id="certStatus" className={`status-${certificate.status}`}>
                            {certificate.status === 1 && "PENDIENTE"}
                            {certificate.status === 2 && "APROBADO"}
                            {certificate.status === 3 && "RECHAZADO"}
                          </div>
                      </div>
                      </div>
                    </div>
                    
                    {/* Permitir resubir solo si status es 1 (PENDIENTE) o 3 (RECHAZADO) */}
                    {(certificate.status === 1 || certificate.status === 3) && (
                      <div id="certUploadActions">
                        <p className="certReuploadText">
                          {certificate.status === 3 
                            ? "Tu certificado fue rechazado. Puedes subir uno nuevo."
                            : "Tu certificado está pendiente de revisión. Puedes actualizar el archivo."}
                        </p>
                        <input
                          type="file"
                          id="certInput"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="certInput" className="certSelectButton">
                          {selectedFile ? selectedFile.name : "SELECCIONAR NUEVO ARCHIVO"}
                        </label>
                        <button 
                          className="certUploadButton"
                          onClick={handleUploadCertificate}
                          disabled={!selectedFile || isUploadingCert}
                        >
                          {isUploadingCert ? "SUBIENDO..." : "ACTUALIZAR"}
                        </button>
                      </div>
                    )}
                    
                    {/* Si status es 2 (APROBADO), solo mostrar mensaje */}
                    {/* {certificate.status === 2 && (
                      <div id="certApprovedMessage">
                        <p>✓ Tu certificado médico ha sido aprobado.</p>
                      </div>
                    )} */}
                  </div>
                ) : (
                  <div id="certUploadContent">
                    <div id="certUploadInfo">
                      <Icon name="note-edit" size={32} color={COLORS.blue_01} />
                      <div id="certUploadText">
                        <p className="certTitle">Subir Apto Físico</p>
                        <p className="certSubtitle">Imagen (JPEG, PNG) o PDF - Máx. 4MB</p>
                      </div>
                    </div>
                    <div id="certUploadActions">
                      <input
                        type="file"
                        id="certInput"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="certInput" className="certSelectButton">
                        {selectedFile ? selectedFile.name : "SELECCIONAR ARCHIVO"}
                      </label>
                      <button 
                        className="certUploadButton"
                        onClick={handleUploadCertificate}
                        disabled={!selectedFile || isUploadingCert}
                      >
                        {isUploadingCert ? "SUBIENDO..." : "SUBIR"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
            </>
          )}

          {/* Sección de Pases Interclubes - Solo mostrar si hay transferencias en proceso */}
          {(() => {
            // Filtrar solo transferencias en proceso (no completadas ni rechazadas)
            const activeTransfers = transfers && transfers.length > 0 
              ? transfers.filter(transfer => transfer.status !== 5 && transfer.status !== 6)
              : [];

            // Solo mostrar la sección si hay transferencias en proceso
            if (activeTransfers.length === 0 && !isLoadingTransfers) {
              return null;
            }

            return (
              <div id="transfersContainer">
                <h4>Pases Interclubes</h4>
                {isLoadingTransfers ? (
                  <p style={{opacity: 0.7}}>Cargando...</p>
                ) : activeTransfers.length > 0 ? (
                  <div id="transfersList">
                    {activeTransfers.map((transfer) => (
                      <div key={transfer.id} className="transferItem">
                        <div className="transferInfo">
                          <div className="transferHeader">
                            <h5>Club Solicitante: {transfer.requesting_club_name || transfer.requesting_club_alias || "Sin nombre"}</h5>
                            <div className={`transferStatus status-${transfer.status}`}>
                              {transfer.status === 6 ? "RECHAZADO" : 
                               transfer.status === 5 ? "COMPLETADO" : 
                               transfer.status === 4 ? "PENDIENTE VALIDACIÓN" : 
                               transfer.status === 3 ? "ESPERANDO PAGO" : 
                               transfer.status === 2 ? "ESPERANDO COSTO" : "EN PROCESO"}
                            </div>
                          </div>
                          <p><strong>Fecha solicitud:</strong> {new Date(transfer.created_at).toLocaleDateString('es-AR')}</p>
                          {transfer.admin_price && (
                            <p className="priceInfo"><strong>Costo a pagar:</strong> ${transfer.admin_price}</p>
                          )}
                          <div className="approvalStatuses">
                            <p><strong>Club solicitante:</strong> <span className={`approval-badge ${getApprovalStatusClass(1)}`}>APROBADO</span></p>
                            <p><strong>Atleta:</strong> <span className={`approval-badge ${getApprovalStatusClass(transfer.athlete_approved)}`}>{getApprovalStatusLabel(transfer.athlete_approved)}</span></p>
                            <p><strong>Club del atleta:</strong> <span className={`approval-badge ${getApprovalStatusClass(transfer.club_approved)}`}>{getApprovalStatusLabel(transfer.club_approved)}</span></p>
                          </div>
                        </div>
                        {transfer.status === 1 && transfer.athlete_approved === null && (
                          <div className="transferActions">
                            <button 
                              className="approveButton"
                              onClick={() => handleApproveTransfer(transfer.id)}
                            >
                              APROBAR
                            </button>
                            <button 
                              className="rejectButton"
                              onClick={() => handleRejectTransfer(transfer.id)}
                            >
                              RECHAZAR
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })()}

          {/* Mejores Marcas de Temporada */}
          <div id="seasonResultsContainer">
            <h4>Mejores Marcas de Temporada</h4>
            <div id="yearResultsContainer">
              <div className="yearSelectorContainer">
                {yearOptions.length > 0 ? (
                  <div className="yearSelector">
                    <Select
                      value={yearOptions.find(option => option.value === selectedYear)}
                      onChange={handleYearChange}
                      options={yearOptions}
                      placeholder="Seleccionar año..."
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={selectStyles}
                    />
                    <label>Mejores Marcas</label>
                  </div>
                ) : null}
              </div>

              {selectedYear && yearResultsData ? (
                <div className="resultsList">
                  {yearResultsData.map((result) => (
                    <AthleteResultItem
                      key={result.id}
                      event={result.discipline_name}
                      unit={result.unit}
                      result={result.result}
                      date={result.date}
                      location={result.place_name}
                      wind={result.wind}
                      weight={result.weight}
                      weightLabel={result.weight_label}
                      isWind={result.isWind}
                      isWeight={result.isWeight}
                    />
                  ))}
                </div>
              ) : selectedYear ? (
                <div className="noResults">
                  <p>No hay marcas registradas en {selectedYear}</p>
                </div>
              ) : (
                <div className="noResults">
                  <p>Selecciona un año para ver las mejores marcas</p>
                </div>
              )}
            </div>
          </div>

          <div id="bestResultsContainer">
            <h4>Mejores Marcas</h4>
            {isLoadingResults ? (
              <p>Cargando...</p>
            ) : bestResults.length > 0 ? (
              bestResults.map((result) =>
                <AthleteResultItem 
                  key={result.id} 
                  event={result.discipline_name}
                  unit={result.unit}
                  result={result.result}
                  date={result.date}
                  location={result.place_name}
                />
              )
            ) : (
              <p style={{opacity: 0.7}}>No hay marcas registradas</p>
            )}
          </div>
        </section>
      </main>

      {/* Modal para selección de imagen de perfil */}
      {showImagePickerModal && (
        <div id="imagePickerModal" onClick={() => setShowImagePickerModal(false)}>
          <div id="imagePickerModalContent" onClick={(e) => e.stopPropagation()}>
            <div id="imagePickerModalHeader">
              <h3>Seleccionar Foto de Perfil</h3>
              <button
                id="imagePickerModalClose"
                onClick={() => setShowImagePickerModal(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={24} color={COLORS.black_01} />
              </button>
            </div>
            <div id="imagePickerModalBody">
              <div id="imagePreviewSection">
                <div id="currentImagePreview">
                  <img
                    src={selectedProfileImage ? URL.createObjectURL(selectedProfileImage) : profileImageGetter(athlete?.image)}
                    alt="Vista previa"
                  />
                </div>
                {selectedProfileImage && (
                  <div id="selectedFileInfo">
                    <p><strong>Archivo:</strong> {selectedProfileImage.name}</p>
                    <p><strong>Tamaño:</strong> {(selectedProfileImage.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              <div id="imagePickerActions">
                <input
                  type="file"
                  id="profileImageInput"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleProfileImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profileImageInput" id="imagePickerSelectButton">
                  <Icon name="note-edit" size={20} color={COLORS.white_01} />
                  {selectedProfileImage ? "CAMBIAR IMAGEN" : "SELECCIONAR IMAGEN"}
                </label>

                <div id="imagePickerModalButtons">
                  <button
                    id="imagePickerCancelButton"
                    onClick={() => {
                      setSelectedProfileImage(null);
                      setShowImagePickerModal(false);
                    }}
                  >
                    CANCELAR
                  </button>
                  <button
                    id="imagePickerConfirmButton"
                    onClick={async () => {
                      if (!selectedProfileImage) {
                        toast.error("Por favor selecciona una imagen primero", { theme: "colored" });
                        return;
                      }

                      await handleUploadProfileImage();
                      setShowImagePickerModal(false);
                    }}
                    disabled={!selectedProfileImage || isUploadingProfileImage}
                  >
                    {isUploadingProfileImage ? "SUBIENDO..." : "SUBIR IMAGEN"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver certificado más grande */}
      {showCertModal && certificate && certImageGetter(certificate.file) && (
        <div id="certModal" onClick={() => setShowCertModal(false)}>
          <div id="certModalContent" onClick={(e) => e.stopPropagation()}>
            <div id="certModalHeader">
              <h3>{certificate.file}</h3>
              <button 
                id="certModalClose" 
                onClick={() => setShowCertModal(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={24} color={COLORS.black_01} />
              </button>
            </div>
            <div id="certModalBody">
              {(() => {
                const ext = certificate.file.toLowerCase().split('.').pop();
                const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
                const isPdf = ext === 'pdf';
                
                if (isImage) {
                  return (
                    <img 
                      src={certImageGetter(certificate.file)} 
                      alt="Certificado médico"
                      id="certModalImage"
                    />
                  );
                } else if (isPdf) {
                  return (
                    <iframe 
                      src={certImageGetter(certificate.file)}
                      id="certModalPdf"
                      title="Certificado médico PDF"
                    />
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar imagen de perfil */}
      {showImagePickerModal && (
        <div id="imagePickerModal" onClick={() => setShowImagePickerModal(false)}>
          <div id="imagePickerModalContent" onClick={(e) => e.stopPropagation()}>
            <div id="imagePickerModalHeader">
              <h3>Seleccionar Foto de Perfil</h3>
              <button
                id="imagePickerModalClose"
                onClick={() => setShowImagePickerModal(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={24} color={COLORS.black_01} />
              </button>
            </div>
            <div id="imagePickerModalBody">
              <div id="imagePreviewSection">
                <div id="currentImagePreview">
                  <img
                    src={selectedProfileImage ? URL.createObjectURL(selectedProfileImage) : profileImageGetter(athlete?.image)}
                    alt="Vista previa"
                  />
                </div>
                {selectedProfileImage && (
                  <div id="selectedFileInfo">
                    <p><strong>Archivo:</strong> {selectedProfileImage.name}</p>
                    <p><strong>Tamaño:</strong> {(selectedProfileImage.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              <div id="imagePickerActions">
                <input
                  type="file"
                  id="profileImageInput"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleProfileImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profileImageInput" id="imagePickerSelectButton">
                  <Icon name="note-edit" size={20} color={COLORS.white_01} />
                  {selectedProfileImage ? "CAMBIAR IMAGEN" : "SELECCIONAR IMAGEN"}
                </label>

                <div id="imagePickerModalButtons">
                  <button
                    id="imagePickerCancelButton"
                    onClick={() => {
                      setSelectedProfileImage(null);
                      setShowImagePickerModal(false);
                    }}
                  >
                    CANCELAR
                  </button>
                  <button
                    id="imagePickerConfirmButton"
                    onClick={async () => {
                      if (!selectedProfileImage) {
                        toast.error("Por favor selecciona una imagen primero", { theme: "colored" });
                        return;
                      }

                      await handleUploadProfileImage();
                      setShowImagePickerModal(false);
                    }}
                    disabled={!selectedProfileImage || isUploadingProfileImage}
                  >
                    {isUploadingProfileImage ? "SUBIENDO..." : "SUBIR IMAGEN"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Transition(Athlete);