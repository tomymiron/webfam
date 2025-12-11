import "material-react-toastify/dist/ReactToastify.css";
import { profileImageGetter, receiptImageGetter } from "../constants/imageGetter";
import { useAuthClub } from "../contexts/AuthContextClub";
import { toast } from "material-react-toastify";
import { useNavigate } from "react-router-dom";
import ClubNavBar from "../components/ClubNavBar";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";
import { useEffect, useState } from "react";
import { makeRequest } from "../config/axios";

function ClubHome() {
  useEffect(() => {import("./styles/clubHome.scss")}, []);

  const { logout, authState } = useAuthClub();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [price, setPrice] = useState(null);

  const club = authState.club;

  useEffect(() => {
    setIsLoading(false);
  }, []);

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

  if(!club || isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <div id="ClubHome">
      <ClubNavBar />

      <main>
        <section>
          <div id="clubInfo">
            <div id="clubInfoHeader">
              <div id="clubImage">
                <img src={profileImageGetter(club?.image)} alt="Club" />
              </div>
              <div id="subClubInfoHeader">
                <h2>{club?.name?.toUpperCase()}</h2>
                <div className="lineSeparator" />
                <p>{club?.alias}</p>
              </div>
            </div>

            <div id="clubInfoBody">
              <p>Club Deportivo</p>
              <button className="red" onClick={handleLogout}>CERRAR SESIÓN</button>
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
                <p>Ver y gestionar los atletas asociados al club.</p>
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
                <h3>Solicitudes de Asociación</h3>
                <p>Revisar y aprobar solicitudes de atletas.</p>
              </div>
              <div className="actionArrow">
                <Icon name="right-arrow" size={24} color={COLORS.black_01} />
              </div>
            </div>
          </div>
        </section>
      </main>

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
    </div>
  )
}

export default Transition(ClubHome);

