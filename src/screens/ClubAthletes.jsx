import "material-react-toastify/dist/ReactToastify.css";
import { useAuthClub } from "../contexts/AuthContextClub";
import { profileImageGetter, certImageGetter, receiptImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import { toast } from "material-react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Transition from "../Transition";

function ClubAthletes() {
  useEffect(() => {import("./styles/clubAthletes.scss")}, []);

  const { authState } = useAuthClub();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'cert' or 'receipt'
  const [selectedFiles, setSelectedFiles] = useState({}); // { athleteId: { cert: File, receipt: File } }
  const [uploadingStates, setUploadingStates] = useState({}); // { athleteId: { cert: boolean, receipt: boolean } }
  const [prices, setPrices] = useState({ affiliation: null, revalidation: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all"); // 'all', 'enabled', 'revalidate', 'affiliate'

  const { data: athletes, isLoading, isError } = useQuery({
    queryFn: () => makeRequest.get("/clubs/own/athletes", {
      headers: { Authorization: authState?.token }
    }).then((res) => res.data),
    queryKey: ["clubAthletes"],
    enabled: !!authState?.token,
  });

  // Filtrar y ordenar atletas
  const filteredAndSortedAthletes = athletes ? (() => {
    // Filtrar por término de búsqueda, categoría y estado
    const filtered = athletes.filter(athlete => {
      // Filtro por nombre/DNI
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        athlete.name?.toLowerCase().includes(searchLower) ||
        athlete.dni?.toString().includes(searchTerm)
      );

      // Filtro por categoría
      const athleteCategory = categoryGetter(athlete.born);
      const matchesCategory = !selectedCategory || athleteCategory === selectedCategory;

      // Filtro por estado
      const isEnabled = athlete.cert_status === 2 &&
                       (athlete.federation !== 1 || athlete.has_valid_payment === 1);
      const needsRevalidate = athlete.federation === 1 && 
                             athlete.affiliated === 1 && 
                             !isEnabled;
      const needsAffiliate = athlete.federation === 1 && 
                            athlete.affiliated === 0 && 
                            !isEnabled;

      let matchesStatus = true;
      if (selectedStatus === 'enabled') {
        matchesStatus = isEnabled;
      } else if (selectedStatus === 'revalidate') {
        matchesStatus = needsRevalidate;
      } else if (selectedStatus === 'affiliate') {
        matchesStatus = needsAffiliate;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Función para ordenar alfabéticamente por nombre
    const sortByName = (a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    };

    // Separar en grupos:
    // 1. Habilitados (certificado aprobado y pagos válidos según federación)
    const enabled = filtered.filter(athlete => 
      athlete.cert_status === 2 &&
      (athlete.federation !== 1 || athlete.has_valid_payment === 1)
    );

    // 2. No habilitados con documentos pendientes (al menos uno en proceso de aprobación)
    const pending = filtered.filter(athlete => {
      const isEnabled = athlete.cert_status === 2 &&
                       (athlete.federation !== 1 || athlete.has_valid_payment === 1);
      const hasPending = (athlete.cert_file && athlete.cert_status === 1) || 
                         (athlete.receipt_file && athlete.receipt_status === 1);
      return !isEnabled && hasPending;
    });

    // 3. Resto de no habilitados (sin documentos, rechazados, etc.)
    const others = filtered.filter(athlete => {
      const isEnabled = athlete.cert_status === 2 &&
                       (athlete.federation !== 1 || athlete.has_valid_payment === 1);
      const hasPending = (athlete.cert_file && athlete.cert_status === 1) || 
                         (athlete.receipt_file && athlete.receipt_status === 1);
      return !isEnabled && !hasPending;
    });

    // Ordenar alfabéticamente cada grupo
    enabled.sort(sortByName);
    pending.sort(sortByName);
    others.sort(sortByName);

    // Retornar en orden: habilitados, pendientes, resto
    return [...enabled, ...pending, ...others];
  })() : [];

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


  const handleFileChange = (athleteId, type, e) => {
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
      
      setSelectedFiles(prev => ({
        ...prev,
        [athleteId]: {
          ...prev[athleteId],
          [type]: file
        }
      }));
    }
  };

  const handleUploadCert = async (athleteId) => {
    const file = selectedFiles[athleteId]?.cert;
    if (!file) {
      toast.error("Por favor selecciona un archivo", { theme: "colored" });
      return;
    }

    setUploadingStates(prev => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], cert: true }
    }));
    
    try {
      const formData = new FormData();
      formData.append('certificate', file);

      const res = await makeRequest.post(`/clubs/own/athletes/${athleteId}/cert`, formData, {
        headers: {
          Authorization: authState?.token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(res.data?.message || "Certificado médico subido exitosamente", { theme: "colored" });
      
      // Limpiar el archivo seleccionado
      setSelectedFiles(prev => {
        const newState = { ...prev };
        if (newState[athleteId]) {
          delete newState[athleteId].cert;
          if (Object.keys(newState[athleteId]).length === 0) {
            delete newState[athleteId];
          }
        }
        return newState;
      });
      
      // Resetear el input de archivo
      const fileInput = document.getElementById(`certInput-${athleteId}`);
      const fileReplaceInput = document.getElementById(`certReplaceInput-${athleteId}`);
      if (fileInput) fileInput.value = '';
      if (fileReplaceInput) fileReplaceInput.value = '';
      
      // Recargar los atletas
      queryClient.invalidateQueries(["clubAthletes"]);
      
    } catch (err) {
      console.error("Error al subir certificado:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al subir el certificado";
      toast.error(errorMessage, { theme: "colored" });
    } finally {
      setUploadingStates(prev => ({
        ...prev,
        [athleteId]: { ...prev[athleteId], cert: false }
      }));
    }
  };

  const handleUploadReceipt = async (athleteId) => {
    const file = selectedFiles[athleteId]?.receipt;
    if (!file) {
      toast.error("Por favor selecciona un archivo", { theme: "colored" });
      return;
    }

    setUploadingStates(prev => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], receipt: true }
    }));
    
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const res = await makeRequest.post(`/clubs/own/athletes/${athleteId}/receipt`, formData, {
        headers: {
          Authorization: authState?.token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(res.data?.message || "Recibo subido exitosamente", { theme: "colored" });
      
      // Limpiar el archivo seleccionado
      setSelectedFiles(prev => {
        const newState = { ...prev };
        if (newState[athleteId]) {
          delete newState[athleteId].receipt;
          if (Object.keys(newState[athleteId]).length === 0) {
            delete newState[athleteId];
          }
        }
        return newState;
      });
      
      // Resetear el input de archivo
      const fileInput = document.getElementById(`receiptInput-${athleteId}`);
      const fileReplaceInput = document.getElementById(`receiptReplaceInput-${athleteId}`);
      if (fileInput) fileInput.value = '';
      if (fileReplaceInput) fileReplaceInput.value = '';
      
      // Recargar los atletas
      queryClient.invalidateQueries(["clubAthletes"]);
      
    } catch (err) {
      console.error("Error al subir recibo:", err);
      const errorMessage = err.response?.data?.message || err.response?.data || "Error al subir el recibo";
      toast.error(errorMessage, { theme: "colored" });
    } finally {
      setUploadingStates(prev => ({
        ...prev,
        [athleteId]: { ...prev[athleteId], receipt: false }
      }));
    }
  };

  const openFileModal = (athlete, type) => {
    setSelectedAthlete(athlete);
    setModalType(type);
    setShowModal(true);
  };

  const getFileUrl = (filename, type) => {
    if (!filename) return null;
    const ext = filename.toLowerCase().split('.').pop();
    if (type === 'cert') {
      return certImageGetter(filename);
    } else {
      return receiptImageGetter(filename);
    }
  };

  return (
    <div id="ClubAthletes">
      <NavBar />

      <main>
        <section>
          <div id="header">
            <h2>ATLETAS DEL CLUB</h2>
            <div className="lineSeparator"/>
            <p>Gestiona los certificados y documentos de tus atletas.</p>
          </div>

          <div id="filters">
            <div className="filterGroup">
              <label>Buscar por nombre</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o DNI del atleta..."
                className="filterInput"
              />
            </div>

            <div className="filterGroup">
              <label>Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filterInput"
              >
                <option value="">Todas las categorías</option>
                <option value="U12">U12</option>
                <option value="U14">U14</option>
                <option value="U16">U16</option>
                <option value="U18">U18</option>
                <option value="U20">U20</option>
                <option value="U23">U23</option>
                <option value="Mayores">Mayores</option>
              </select>
            </div>

            <div className="filterGroup">
              <label>Estado</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filterInput"
              >
                <option value="all">Todos</option>
                <option value="enabled">Habilitados</option>
                <option value="revalidate">Revalidar</option>
                <option value="affiliate">Afiliar</option>
              </select>
            </div>

            <button className="resetButton" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedStatus("all");
            }}>
              Limpiar Filtros
            </button>
          </div>

          <div id="athletesContainer">
            {isLoading ? (
              <p>Cargando...</p>
            ) : isError ? (
              <p>Error al cargar atletas</p>
            ) : filteredAndSortedAthletes && filteredAndSortedAthletes.length > 0 ? (
              filteredAndSortedAthletes.map((athlete) => (
                <div key={athlete.id} className="athleteCard">
                  <div 
                    className="athleteInfo" 
                    onClick={() => navigate(`/athlete/${athlete.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={profileImageGetter(athlete.image)} alt={athlete.name} className="athleteImage" />
                    <div className="athleteDetails">
                      <h3>{athlete.name}</h3>
                      <div className="athleteMeta">
                        <span>DNI: {athlete.dni}</span>
                        <span>•</span>
                        <span>{categoryGetter(athlete.born)}</span>
                      </div>
                    </div>
                    {/* Verificar si el atleta está habilitado */}
                    {athlete.cert_status === 2 &&
                     (athlete.federation !== 1 || athlete.has_valid_payment === 1) && (
                      <div className="enabledBadge">
                        HABILITADO
                      </div>
                    )}
                  </div>

                  {/* Solo mostrar documentos si no está habilitado */}
                  {!(athlete.cert_status === 2 &&
                     (athlete.federation !== 1 || athlete.has_valid_payment === 1)) && (
                    <div className="documentsGrid">
                      {/* Certificado Médico */}
                      <div className="documentCard">
                      <div className="documentHeader">
                        <h4>Certificado Médico</h4>
                      </div>
                      {athlete.cert_file ? (
                        <div className="documentContent">
                          <div 
                            className="documentPreview"
                            onClick={() => openFileModal(athlete, 'cert')}
                          >
                            {(() => {
                              const ext = athlete.cert_file.toLowerCase().split('.').pop();
                              const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
                              if (isImage) {
                                return <img src={certImageGetter(athlete.cert_file)} alt="Certificado" />;
                              } else {
                                return <iframe src={certImageGetter(athlete.cert_file)} title="Certificado PDF" />;
                              }
                            })()}
                          </div>
                          <div className="documentInfo">
                            <div className="documentFooter">
                              <div className="statusRow">
                                <div className={`statusBadge status-${athlete.cert_status}`}>
                                  {athlete.cert_status === 1 && "PENDIENTE"}
                                  {athlete.cert_status === 2 && "APROBADO"}
                                  {athlete.cert_status === 3 && "RECHAZADO"}
                                </div>
                                <span className="documentDate">
                                  {new Date(athlete.cert_updated_at).toLocaleDateString('es-AR')}
                                </span>
                              </div>
                            </div>
                            {/* Permitir reemplazar si está pendiente o rechazado */}
                            {(athlete.cert_status === 1 || athlete.cert_status === 3) && (
                              <div className="replaceSection">
                                <input
                                  type="file"
                                  id={`certReplaceInput-${athlete.id}`}
                                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                                  onChange={(e) => handleFileChange(athlete.id, 'cert', e)}
                                  style={{ display: 'none' }}
                                />
                                <label htmlFor={`certReplaceInput-${athlete.id}`} className="replaceLabel">
                                  Reemplazar
                                </label>
                                {selectedFiles[athlete.id]?.cert && (
                                  <button
                                    className="uploadBtn"
                                    onClick={() => handleUploadCert(athlete.id)}
                                    disabled={uploadingStates[athlete.id]?.cert}
                                  >
                                    {uploadingStates[athlete.id]?.cert ? "Subiendo..." : "SUBIR"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="uploadSection">
                          <input
                            type="file"
                            id={`certInput-${athlete.id}`}
                            accept="image/jpeg,image/jpg,image/png,application/pdf"
                            onChange={(e) => handleFileChange(athlete.id, 'cert', e)}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor={`certInput-${athlete.id}`} className="uploadLabel">
                            Seleccionar archivo
                          </label>
                          {selectedFiles[athlete.id]?.cert && (
                            <div className="fileInfo">
                              <p>{selectedFiles[athlete.id].cert.name}</p>
                              <button
                                className="uploadBtn"
                                onClick={() => handleUploadCert(athlete.id)}
                                disabled={uploadingStates[athlete.id]?.cert}
                              >
                                {uploadingStates[athlete.id]?.cert ? "Subiendo..." : "SUBIR"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Recibo de Afiliación/Revalida - Solo mostrar si NO es U12 o U14 */}
                    {(() => {
                      const athleteCategory = categoryGetter(athlete.born);
                      const isU12OrU14 = athleteCategory === 'U12' || athleteCategory === 'U14';
                      
                      if (isU12OrU14) {
                        return null; // No mostrar sección de recibo para U12/U14
                      }
                      
                      return (
                        <div className="documentCard">
                          <div className="documentHeader">
                            <h4>
                              {athlete.affiliated === 0 ? "Afiliación" : "Revalida"}
                              {athlete.affiliated === 0 ? (
                                prices.affiliation && <span className="priceInTitle"> ${prices.affiliation}</span>
                              ) : (
                                prices.revalidation && <span className="priceInTitle"> ${prices.revalidation}</span>
                              )}
                            </h4>
                          </div>
                          {athlete.receipt_file ? (
                            <div className="documentContent">
                              <div 
                                className="documentPreview"
                                onClick={() => openFileModal(athlete, 'receipt')}
                              >
                                {(() => {
                                  const ext = athlete.receipt_file.toLowerCase().split('.').pop();
                                  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
                                  if (isImage) {
                                    return <img src={receiptImageGetter(athlete.receipt_file)} alt="Recibo" />;
                                  } else {
                                    return <iframe src={receiptImageGetter(athlete.receipt_file)} title="Recibo PDF" />;
                                  }
                                })()}
                              </div>
                              <div className="documentInfo">
                                <div className="documentFooter">
                                  <div className="statusRow">
                                    <div className={`statusBadge status-${athlete.receipt_status}`}>
                                      {athlete.receipt_status === 1 && "PENDIENTE"}
                                      {athlete.receipt_status === 2 && "APROBADO"}
                                      {athlete.receipt_status === 3 && "RECHAZADO"}
                                    </div>
                                    <span className="documentDate">
                                      {new Date(athlete.receipt_updated_at).toLocaleDateString('es-AR')}
                                    </span>
                                  </div>
                                </div>
                                {/* Permitir reemplazar si está pendiente o rechazado */}
                                {(athlete.receipt_status === 1 || athlete.receipt_status === 3) && (
                                  <div className="replaceSection">
                                    <input
                                      type="file"
                                      id={`receiptReplaceInput-${athlete.id}`}
                                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                                      onChange={(e) => handleFileChange(athlete.id, 'receipt', e)}
                                      style={{ display: 'none' }}
                                    />
                                    <label htmlFor={`receiptReplaceInput-${athlete.id}`} className="replaceLabel">
                                      Reemplazar
                                    </label>
                                    {selectedFiles[athlete.id]?.receipt && (
                                      <button
                                        className="uploadBtn"
                                        onClick={() => handleUploadReceipt(athlete.id)}
                                        disabled={uploadingStates[athlete.id]?.receipt}
                                      >
                                        {uploadingStates[athlete.id]?.receipt ? "Subiendo..." : "SUBIR"}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="uploadSection">
                              <input
                                type="file"
                                id={`receiptInput-${athlete.id}`}
                                accept="image/jpeg,image/jpg,image/png,application/pdf"
                                onChange={(e) => handleFileChange(athlete.id, 'receipt', e)}
                                style={{ display: 'none' }}
                              />
                              <label htmlFor={`receiptInput-${athlete.id}`} className="uploadLabel">
                                Seleccionar archivo
                              </label>
                              {selectedFiles[athlete.id]?.receipt && (
                                <div className="fileInfo">
                                  <p>{selectedFiles[athlete.id].receipt.name}</p>
                                  <button
                                    className="uploadBtn"
                                    onClick={() => handleUploadReceipt(athlete.id)}
                                    disabled={uploadingStates[athlete.id]?.receipt}
                                  >
                                    {uploadingStates[athlete.id]?.receipt ? "Subiendo..." : "SUBIR"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  )}
                </div>
              ))
            ) : searchTerm ? (
              <p className="emptyMessage">No se encontraron atletas que coincidan con la búsqueda</p>
            ) : (
              <p className="emptyMessage">No hay atletas en el club</p>
            )}
          </div>
        </section>
      </main>

      {/* Modal para ver documento completo */}
      {showModal && selectedAthlete && modalType && (
        <div id="fileModal" onClick={() => setShowModal(false)}>
          <div id="fileModalContent" onClick={(e) => e.stopPropagation()}>
            <div id="fileModalHeader">
              <h3>
                {modalType === 'cert' ? 'Certificado Médico' : (selectedAthlete.affiliated === 0 ? 'Afiliación' : 'Revalida')} - {selectedAthlete.name}
              </h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div id="fileModalBody">
              {(() => {
                const file = modalType === 'cert' ? selectedAthlete.cert_file : selectedAthlete.receipt_file;
                if (!file) return <p>No hay archivo</p>;
                
                const ext = file.toLowerCase().split('.').pop();
                const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
                const fileUrl = getFileUrl(file, modalType);
                
                if (isImage) {
                  return <img src={fileUrl} alt="Documento" />;
                } else {
                  return <iframe src={fileUrl} title="Documento PDF" />;
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transition(ClubAthletes);

