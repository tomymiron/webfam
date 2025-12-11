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
import { makeRequest } from "../config/axios";


function Athlete() {
  useEffect(() => {import("./styles/athlete.scss")}, []);

  const { logout, authState, updateUser } = useAuth();
  const navigate = useNavigate();
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
              <div id="athleteImage">
                <img src={profileImageGetter(athlete?.image)} alt="Athlete" />
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
              {/* <button style={{flex: 1}}>CAMBIO DE DATOS</button> */}
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
                />
              )
            ) : (
              <p style={{opacity: 0.7}}>No hay marcas registradas</p>
            )}
            <div style={{height: 128}}/>
          </div>
        </section>
      </main>

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


    </div>
  )
}

export default Transition(Athlete);