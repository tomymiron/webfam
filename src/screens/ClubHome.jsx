import "material-react-toastify/dist/ReactToastify.css";
import { profileImageGetter, receiptImageGetter } from "../constants/imageGetter";
import { useAuthClub } from "../contexts/AuthContextClub";
import { toast } from "material-react-toastify";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";
import { useEffect, useState } from "react";
import { makeRequest } from "../config/axios";
import BankingDataModal from "../components/BankingDataModal";

function ClubHome() {
  useEffect(() => {import("./styles/clubHome.scss")}, []);

  const { logout, authState, updateClub } = useAuthClub();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [price, setPrice] = useState(null);

  // Estados para edición de perfil
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newDescription, setNewDescription] = useState('');
  
  // Estados para PIN de fondos
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [verifiedFunds, setVerifiedFunds] = useState(null);
  const [showFunds, setShowFunds] = useState(false);
  const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);

  const club = authState.club;

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Actualizar datos del club al cargar el componente
  useEffect(() => {
    const fetchClubData = async () => {
      if (!authState?.token || !authState?.authenticated) {
        return;
      }

      try {
        const res = await makeRequest.get("/clubs/own/me", {
          headers: { Authorization: authState.token }
        });
        
        if (res.data?.club) {
          await updateClub(res.data.club);
        }
      } catch (err) {
        console.log("Error al actualizar datos del club:", err);
      }
    };

    fetchClubData();
  }, [authState?.token, authState?.authenticated, updateClub]);

  // Inicializar email y descripción cuando se carga el club
  useEffect(() => {
    if (club?.email && !isEditingEmail) {
      setNewEmail(club.email);
    }
    if (club?.description && !isEditingDescription) {
      setNewDescription(club.description || '');
    }
  }, [club?.email, club?.description, isEditingEmail, isEditingDescription]);

  // Cargar recibo del club
  useEffect(() => {
    const fetchReceipt = async () => {
      if (!authState?.token || !authState?.authenticated) {
        setIsLoadingReceipt(false);
        return;
      }

      try {
        const res = await makeRequest.get("/clubs/own/receipt", {
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

  // Cargar precio de afiliación del club
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await makeRequest.get("/users/prices?ids=12");
        
        if (res.data?.prices && res.data.prices.length > 0) {
          setPrice(res.data.prices[0].price);
        }
      } catch (err) {
        console.log("Error al cargar precio:", err);
      }
    };

    fetchPrice();
  }, []);

  // Cargar fondos del club
  const [clubFunds, setClubFunds] = useState(null);
  const [fundVisible, setFundVisible] = useState(null);

  useEffect(() => {
    const fetchClubFunds = async () => {
      if (!authState?.token || !authState?.authenticated) {
        return;
      }

      try {
        const res = await makeRequest.get("/clubs/own/funds", {
          headers: { Authorization: authState.token }
        });
        
        if (res.data) {
          setClubFunds(res.data.funds);
          setFundVisible(res.data.fund_visible);
          
          // Si fund_visible es null, mostrar fondos directamente
          if (res.data.fund_visible === null) {
            setShowFunds(true);
            setVerifiedFunds(res.data.funds);
          }
        }
      } catch (err) {
        console.log("Error al cargar fondos:", err);
      }
    };

    fetchClubFunds();
  }, [authState?.token, authState?.authenticated]);

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

      const res = await makeRequest.post("/clubs/own/receipt", formData, {
        headers: {
          Authorization: authState?.token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(res.data?.message || "Recibo subido exitosamente", { theme: "colored" });
      setSelectedReceipt(null);
      
      // Resetear el input de archivo
      const fileInput = document.getElementById('clubReceiptInput');
      if (fileInput) fileInput.value = '';
      
      // Recargar el recibo
      const receiptRes = await makeRequest.get("/clubs/own/receipt", {
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

  const handleLogout = () => {
    toast.success("Cerrando sesión...", { theme: "colored" });
    navigate("/login");
    logout();
  }

  const handleVerifyPin = async () => {
    if (!pinInput || pinInput.length !== 4) {
      toast.error("Ingresa un PIN de 4 dígitos", { theme: "colored" });
      return;
    }

    try {
      const res = await makeRequest.post("/clubs/own/funds/verify-pin", {
        pin: pinInput
      }, {
        headers: { Authorization: authState?.token }
      });

      if (res.data?.verified) {
        setVerifiedFunds(res.data.funds);
        setShowFunds(true);
        setShowPinModal(false);
        setPinInput('');
        toast.success("PIN correcto", { theme: "colored" });
      }
    } catch (err) {
      console.error("Error al verificar PIN:", err);
      const errorMessage = err.response?.data || "PIN incorrecto";
      toast.error(errorMessage, { theme: "colored" });
      setPinInput('');
    }
  }

  const handleShowFundsClick = () => {
    if (fundVisible === null) {
      // Si no hay PIN, mostrar fondos directamente
      setShowFunds(!showFunds);
    } else {
      // Si hay PIN, mostrar modal para ingresar PIN
      if (showFunds) {
        setShowFunds(false);
        setVerifiedFunds(null);
      } else {
        setShowPinModal(true);
      }
    }
  }

  // Funciones para edición de perfil
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

  const handleUploadProfileImage = async () => {
    if (!selectedProfileImage) {
      toast.error("Por favor selecciona una imagen", { theme: "colored" });
      return;
    }

    setIsUploadingProfileImage(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', selectedProfileImage);

      const res = await makeRequest.post("/clubs/own/profile-image", formData, {
        headers: {
          Authorization: authState?.token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(res.data?.message || "Foto de perfil actualizada exitosamente", { theme: "colored" });
      setSelectedProfileImage(null);
      setShowImagePickerModal(false);

      // Resetear el input de archivo
      const fileInput = document.getElementById('clubProfileImageInput');
      if (fileInput) fileInput.value = '';

      // Actualizar el estado del club
      const clubRes = await makeRequest.get("/clubs/own/me", {
        headers: { Authorization: authState.token }
      });
      if (clubRes.data?.club) {
        await updateClub(clubRes.data.club);
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
      const res = await makeRequest.put("/clubs/own/email", {
        email: newEmail
      }, {
        headers: { Authorization: authState?.token }
      });

      toast.success(res.data?.message || "Email actualizado exitosamente", { theme: "colored" });

      // Limpiar campos
      setNewEmail('');
      setIsEditingEmail(false);

      // Actualizar el estado del club
      const clubRes = await makeRequest.get("/clubs/own/me", {
        headers: { Authorization: authState.token }
      });
      if (clubRes.data?.club) {
        await updateClub(clubRes.data.club);
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
      const res = await makeRequest.put("/clubs/own/password", {
        newPassword: newPassword
      }, {
        headers: { Authorization: authState?.token }
      });

      toast.success(res.data?.message || "Contraseña actualizada exitosamente", { theme: "colored" });

      // Limpiar campos
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingPassword(false);

    } catch (err) {
      console.error("Error al actualizar contraseña:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al actualizar la contraseña";
      toast.error(errorMessage, { theme: "colored" });
    }
  };

  const handleUpdateDescription = async () => {
    try {
      const res = await makeRequest.put("/clubs/own/description", {
        description: newDescription
      }, {
        headers: { Authorization: authState?.token }
      });

      toast.success(res.data?.message || "Descripción actualizada exitosamente", { theme: "colored" });

      // Limpiar campos
      setIsEditingDescription(false);

      // Actualizar el estado del club
      const clubRes = await makeRequest.get("/clubs/own/me", {
        headers: { Authorization: authState.token }
      });
      if (clubRes.data?.club) {
        await updateClub(clubRes.data.club);
      }

    } catch (err) {
      console.error("Error al actualizar descripción:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al actualizar la descripción";
      toast.error(errorMessage, { theme: "colored" });
    }
  };

  if(!club || isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <div id="ClubHome">
      <NavBar />

      <main>
        <section>
          <div id="clubInfo">
            <div id="clubInfoHeader">
              <div id="clubImage" onClick={() => setShowImagePickerModal(true)} style={{ cursor: 'pointer' }}>
                <img src={profileImageGetter(club?.image)} alt="Club" />
                <div className="imageOverlay">
                  <Icon name="note-edit" size={20} color={COLORS.white_01} />
                </div>
              </div>
              <div id="subClubInfoHeader">
                <h2>{club?.name?.toUpperCase()}</h2>
                <div className="lineSeparator" />
                <p>{club?.alias}</p>
              </div>
            </div>

            <div id="clubInfoBody">
              <button 
                style={{
                  backgroundColor: COLORS.cyan_01,
                  color: COLORS.black_01,
                  padding: '10px 20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  height: '40px'
                }}
                onClick={() => setIsBankingModalOpen(true)}
              >
                DATOS BANCARIOS
              </button>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {clubFunds !== null && (
                  <button 
                    className="fundsButton" 
                    onClick={handleShowFundsClick}
                    style={{
                      backgroundColor: showFunds ? COLORS.green_01 : COLORS.blue_01,
                      color: COLORS.white_01,
                      padding: '10px 15px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      height: '40px'
                    }}
                  >
                    {showFunds 
                      ? `Fondos: $${verifiedFunds?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : fundVisible === null 
                        ? "Ver Fondos" 
                        : "Ingresar PIN"}
                  </button>
                )}
                <button className="red" onClick={handleLogout}>CERRAR SESIÓN</button>
              </div>
            </div>

            {/* Email section */}
            <div id="emailSection">
              <div id="emailDisplay">
                {!isEditingEmail && <span id="emailLabel">Email:</span>}
                {isEditingEmail ? (
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Nuevo email"
                    id="emailInput"
                  />
                ) : (
                  <span id="emailValue">{club?.email}</span>
                )}
                <button
                  id="editEmailButton"
                  onClick={() => {
                    if (isEditingEmail) {
                      handleUpdateEmail();
                    } else {
                      setNewEmail(club?.email || '');
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

            {/* Description section */}
            <div id="descriptionSection">
              <div id="descriptionDisplay">
                {!isEditingDescription && <span id="descriptionLabel">Descripción:</span>}
                {isEditingDescription ? (
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Descripción del club"
                    id="descriptionInput"
                    rows={4}
                  />
                ) : (
                  <span id="descriptionValue">{club?.description || 'Sin descripción'}</span>
                )}
                <button
                  id="editDescriptionButton"
                  onClick={() => {
                    if (isEditingDescription) {
                      handleUpdateDescription();
                    } else {
                      setNewDescription(club?.description || '');
                      setIsEditingDescription(true);
                    }
                  }}
                >
                  {isEditingDescription ? 'GUARDAR' : 'EDITAR'}
                </button>
                {isEditingDescription && (
                  <button
                    id="cancelDescriptionButton"
                    onClick={() => {
                      setIsEditingDescription(false);
                      setNewDescription('');
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

          {/* Sección de Afiliación del Club */}
          <div id="clubReceiptContainer">
            <h4>
              Afiliación del Club
              {price && <span className="priceInTitle"> ${price}</span>}
            </h4>
            
            {isLoadingReceipt ? (
              <div id="clubReceiptUploadContent">
                <p>Cargando...</p>
              </div>
            ) : (
              <>
                {receipt ? (
                  <div id="clubReceiptUploadContent">
                    {price && (
                      <div id="clubReceiptPriceBadge">
                        <span className="clubReceiptPriceLabel">Monto a pagar:</span>
                        <span className="clubReceiptPriceValue">${price}</span>
                      </div>
                    )}
                    <div id="clubReceiptCurrentFile">
                      <div id="clubReceiptFileInfo">
                        <div 
                          id="clubReceiptPreview" 
                          onClick={() => setShowReceiptModal(true)}
                          className="clubReceiptPreviewClickable"
                        >
                          {receiptImageGetter(receipt.file) ? (
                            (() => {
                              const ext = receipt.file.toLowerCase().split('.').pop();
                              const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
                              const isPdf = ext === 'pdf';
                              
                              if (isImage) {
                                return (
                                  <img 
                                    src={receiptImageGetter(receipt.file)} 
                                    alt="Recibo"
                                    className="clubReceiptPreviewImage"
                                  />
                                );
                              } else if (isPdf) {
                                return (
                                  <iframe 
                                    src={receiptImageGetter(receipt.file)}
                                    className="clubReceiptPreviewPdf"
                                    title="Preview recibo PDF"
                                  />
                                );
                              }
                              return null;
                            })()
                          ) : (
                            <Icon name="note-edit" size={32} color={COLORS.blue_01} />
                          )}
                        </div>
                        <div id="clubReceiptFileDetails">
                          <p className="clubReceiptFileName">{receipt.file}</p>
                          <p className="clubReceiptFileDate">Subido: {new Date(receipt.updated_at).toLocaleDateString('es-AR')}</p>
                          <p className="clubReceiptClickHint">Click para ver más grande</p>
                          <div id="clubReceiptStatus" className={`status-${receipt.status}`}>
                            {receipt.status === 1 && "PENDIENTE"}
                            {receipt.status === 2 && "APROBADO"}
                            {receipt.status === 3 && "RECHAZADO"}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Permitir resubir solo si status es 1 (PENDIENTE) o 3 (RECHAZADO) */}
                    {(receipt.status === 1 || receipt.status === 3) && (
                      <div id="clubReceiptUploadActions">
                        <p className="clubReceiptReuploadText">
                          {receipt.status === 3 
                            ? "Tu recibo fue rechazado. Puedes subir uno nuevo."
                            : "Tu recibo está pendiente de revisión. Puedes actualizar el archivo."}
                        </p>
                        <input
                          type="file"
                          id="clubReceiptInput"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleReceiptChange}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="clubReceiptInput" className="clubReceiptSelectButton">
                          {selectedReceipt ? selectedReceipt.name : "SELECCIONAR NUEVO ARCHIVO"}
                        </label>
                        <button 
                          className="clubReceiptUploadButton"
                          onClick={handleUploadReceipt}
                          disabled={!selectedReceipt || isUploadingReceipt}
                        >
                          {isUploadingReceipt ? "SUBIENDO..." : "ACTUALIZAR"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div id="clubReceiptUploadContent">
                    {price && (
                      <div id="clubReceiptPriceBadge">
                        <span className="clubReceiptPriceLabel">Monto a pagar:</span>
                        <span className="clubReceiptPriceValue">${price}</span>
                      </div>
                    )}
                    <div id="clubReceiptUploadInfo">
                      <Icon name="note-edit" size={32} color={COLORS.blue_01} />
                      <div id="clubReceiptUploadText">
                        <p className="clubReceiptTitle">
                          Subir Comprobante de Afiliación
                        </p>
                        <p className="clubReceiptSubtitle">
                          Imagen (JPEG, PNG) o PDF - Máx. 4MB
                        </p>
                      </div>
                    </div>
                    <div id="clubReceiptUploadActions">
                      <input
                        type="file"
                        id="clubReceiptInput"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={handleReceiptChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="clubReceiptInput" className="clubReceiptSelectButton">
                        {selectedReceipt ? selectedReceipt.name : "SELECCIONAR ARCHIVO"}
                      </label>
                      <button 
                        className="clubReceiptUploadButton"
                        onClick={handleUploadReceipt}
                        disabled={!selectedReceipt || isUploadingReceipt}
                      >
                        {isUploadingReceipt ? "SUBIENDO..." : "SUBIR"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section>
          <div id="clubActions">
            <h4>Gestión de Club</h4>
            
            <div className="actionCard" onClick={() => navigate("/club/athletes")}>
              <div className="actionIcon">
                <Icon name="users-group" size={32} color={COLORS.blue_01} />
              </div>
              <div className="actionContent">
                <h3>Atletas del Club</h3>
                <p>Ver y gestionar los atletas asociados al club. (revalidas, afiliaciones, etc.)</p>
              </div>
              <div className="actionArrow">
                <Icon name="right-arrow" size={24} color={COLORS.black_01} />
              </div>
            </div>

            <div className="actionCard" onClick={() => navigate("/club/requests")}>
              <div className="actionIcon">
                <Icon name="user-check" size={32} color={COLORS.blue_01} />
              </div>
              <div className="actionContent">
                <h3>Solicitudes de Afiliacion</h3>
                <p>Revisar y aprobar solicitudes de atletas.</p>
              </div>
              <div className="actionArrow">
                <Icon name="right-arrow" size={24} color={COLORS.black_01} />
              </div>
            </div>

            <div className="actionCard" onClick={() => navigate("/club/transfers")}>
              <div className="actionIcon">
                <Icon name="user-check" size={32} color={COLORS.blue_01} />
              </div>
              <div className="actionContent">
                <h3>Solicitar Pase</h3>
                <p>Solicitar pases interclubes de atletas.</p>
              </div>
              <div className="actionArrow">
                <Icon name="right-arrow" size={24} color={COLORS.black_01} />
              </div>
            </div>
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
                    src={selectedProfileImage ? URL.createObjectURL(selectedProfileImage) : profileImageGetter(club?.image)}
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
                  id="clubProfileImageInput"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleProfileImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="clubProfileImageInput" id="imagePickerSelectButton">
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

      {/* Modal para ver recibo completo */}
      {showReceiptModal && receipt && (
        <div id="clubReceiptModal" onClick={() => setShowReceiptModal(false)}>
          <div id="clubReceiptModalContent" onClick={(e) => e.stopPropagation()}>
            <div id="clubReceiptModalHeader">
              <h3>Comprobante de Afiliación</h3>
              <button onClick={() => setShowReceiptModal(false)}>✕</button>
            </div>
            <div id="clubReceiptModalBody">
              {(() => {
                const ext = receipt.file.toLowerCase().split('.').pop();
                const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
                const fileUrl = receiptImageGetter(receipt.file);
                
                if (isImage) {
                  return <img src={fileUrl} alt="Comprobante" />;
                } else {
                  return <iframe src={fileUrl} title="Comprobante PDF" />;
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal para ingresar PIN */}
      {showPinModal && (
        <div id="clubReceiptModal" onClick={() => setShowPinModal(false)}>
          <div id="clubReceiptModalContent" onClick={(e) => e.stopPropagation()}>
            <div id="clubReceiptModalHeader">
              <h3>Ingresar PIN para Ver Fondos</h3>
              <button onClick={() => {
                setShowPinModal(false);
                setPinInput('');
              }}>✕</button>
            </div>
            <div id="clubReceiptModalBody" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  PIN de 4 dígitos:
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Ingresa el PIN"
                  maxLength={4}
                  style={{
                    padding: '12px',
                    fontSize: '18px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    textAlign: 'center',
                    letterSpacing: '8px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPin();
                    }
                  }}
                />
                <button
                  onClick={handleVerifyPin}
                  disabled={pinInput.length !== 4}
                  style={{
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backgroundColor: pinInput.length === 4 ? COLORS.blue_01 : '#ccc',
                    color: COLORS.white_01,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: pinInput.length === 4 ? 'pointer' : 'not-allowed'
                  }}
                >
                  VERIFICAR PIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BankingDataModal 
        isOpen={isBankingModalOpen} 
        onClose={() => setIsBankingModalOpen(false)} 
      />
    </div>
  )
}

export default Transition(ClubHome);

