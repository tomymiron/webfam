import { dateOnlyFormatter, timeLeft, timeSince } from "../constants/timeGetter";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import { COLORS, SIZES } from "../constants/theme";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultCert from "../assets/default_cert.pdf";
import BankingDataModal from "../components/BankingDataModal";


export function Home() {
  useEffect(() => {import("./styles/home.scss")}, []);
  const navigate = useNavigate();
  const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);

  const { data: meets, isLoading: isLoadingMeets, isError: isErrorMeets } = useQuery({
    queryFn: () => makeRequest.get("/meets").then((res) => res.data),
    queryKey: ["meets"],
  });

  const { data: news, isLoading: isLoadingNews } = useQuery({
    queryFn: () => makeRequest.get("/news/latest?limit=10").then((res) => res.data),
    queryKey: ["latestNews"],
  });

  const { data: sponsors, isLoading: isLoadingSponsors } = useQuery({
    queryFn: () => makeRequest.get("/sponsors").then((res) => res.data),
    queryKey: ["sponsors"],
  });

  // Obtener año actual dinámicamente
  const currentYear = new Date().getFullYear();

  // Obtener estadísticas desde el endpoint dedicado
  const { data: meetsWithResults, isLoading: isLoadingMeetsWithResults } = useQuery({
    queryFn: () => makeRequest.get("/meets/with-results", { params: { limit: 3 } }).then((res) => res.data),
    queryKey: ["meetsWithResults"],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryFn: () => makeRequest.get("/results/statistics").then((res) => res.data),
    queryKey: ["statistics"],
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  // Valores por defecto mientras carga (usando año actual dinámico)
  const statsData = stats || {
    totalAthletes: 0,
    activeAthletes: 0,
    totalMarks: 0,
    currentYearMarks: 0,
    uniqueClubs: 0,
    currentYear: currentYear
  };

  // Asegurar que siempre use el año actual (por si el backend no lo devuelve)
  const displayYear = statsData.currentYear || currentYear;

  const getImageUrl = (image) => {
    if (!image) return null;
    const baseUrl = import.meta.env.VITE_API_URL;
    return `${baseUrl}/image/news/${image}`;
  };

  const getSponsorImageUrl = (image) => {
    if (!image) return null;
    const baseUrl = import.meta.env.VITE_API_URL;
    return `${baseUrl}/image/sponsors/${image}`;
  };

  return (
    <div id="Home">

      <NavBar />

      <main>
        <section className="firstSection">
          <div id="titleContainer">
            <p id="subTitle">Estas en el sitio web de la</p>
            <h1 id="title">FEDERACION ATLETICA<br/>METROPOLITANA</h1>
            <div id="titleButtonsContainer">
              <button style={{ backgroundColor: COLORS.purple_01 }} onClick={() => window.open("https://www.instagram.com/webfamok/", "_blank")} >
                <p>TUTORIALES</p>
              </button>
              <button style={{backgroundColor: COLORS.orange_01}} onClick={() => window.open(defaultCert, '_blank')} >
                <p>APTO FISICO</p>
              </button>
              <button style={{backgroundColor: COLORS.black_01}} onClick={() => window.location.href = 'mailto:info@webfam.com.ar'} >
                <p style={{color: COLORS.white_01}}>MAIL FAM</p>
              </button>
              <button style={{backgroundColor: COLORS.cyan_01}} onClick={() => setIsBankingModalOpen(true)} >
                <p>DATOS BANCARIOS</p>
              </button>
              <div style={{ flexBasis: "100%", height: 0, padding: 0, margin: 0 }} />

              <button style={{ backgroundColor: COLORS.purple_01, padding: "9px 32px" }} onClick={() => window.open("https://www.instagram.com/webfamok/", "_blank")} >
                <Icon name="instagram" size={24} color={COLORS.black_01} />
              </button>
              <button style={{ backgroundColor: COLORS.cyan_01, padding: "9px 32px" }} onClick={() => window.open("https://www.facebook.com/webfamok", "_blank")} >
                <Icon name="facebook" size={24} color={COLORS.black_01} />
              </button>
              <button style={{backgroundColor: COLORS.purple_01}} onClick={() => navigate("/aranceles")} >
                <p>ARANCELES</p>
              </button>
            </div>
          </div>

          {Array.isArray(sponsors) && sponsors.length > 0 && (
            <div id="sponsorsContainer">
              {sponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.link || "#"}
                  target={sponsor.link ? "_blank" : undefined}
                  rel={sponsor.link ? "noopener noreferrer" : undefined}
                  className="sponsorItem"
                  style={!sponsor.link ? { cursor: "default", pointerEvents: "none" } : {}}
                >
                  {getSponsorImageUrl(sponsor.image) && (
                    <img 
                      src={getSponsorImageUrl(sponsor.image)} 
                      alt={sponsor.text}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  {sponsor.text && (
                    <p>{sponsor.text}</p>
                  )}
                </a>
              ))}
            </div>
          )}

          <div id="wavesContainer">
            <svg viewBox="0 0 1512 428" fill="none" xmlns="http://www.w3.org/2000/svg" id="waves" preserveAspectRatio="none">
              <path d="M0 63.2655C83.9977 61.0034 168.001 58.7464 251.998 43.8113C336.001 28.8763 419.999 1.26836 504.002 0.0432555C587.999 -1.18184 672.002 23.981 756 29.222C839.998 34.463 924.001 19.7821 1008 19.4974C1092 19.2077 1176 33.309 1260 48.6762C1344 64.0433 1428 80.6711 1512 97.304V428C1428 428 1344 428 1260 428C1176 428 1092 428 1008 428C924.001 428 839.998 428 756 428C672.002 428 587.999 428 504.002 428C419.999 428 336.001 428 251.998 428C168.001 428 83.9977 428 0 428V63.2655Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 29.2219C83.9977 31.6111 168.001 34.0003 251.998 53.5358C336.001 73.0713 419.999 109.753 504.002 126.483C587.999 143.212 672.002 139.994 756 131.347C839.998 122.701 924.001 108.63 1008 82.7145C1092 56.7993 1176 19.0398 1260 24.3571C1344 29.6794 1428 78.0835 1512 126.483V427.999C1428 427.999 1344 427.999 1260 427.999C1176 427.999 1092 427.999 1008 427.999C924.001 427.999 839.998 427.999 756 427.999C672.002 427.999 587.999 427.999 504.002 427.999C419.999 427.999 336.001 427.999 251.998 427.999C168.001 427.999 83.9977 427.999 0 427.999V29.2219Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 145.937C83.9977 126.737 168.001 107.537 251.998 92.4441C336.001 77.3515 419.999 66.3662 504.002 72.9899C587.999 79.6136 672.002 103.846 756 126.483C839.998 149.124 924.001 170.174 1008 165.391C1092 160.602 1176 129.98 1260 116.758C1344 103.536 1428 107.715 1512 111.893V427.999C1428 427.999 1344 427.999 1260 427.999C1176 427.999 1092 427.999 1008 427.999C924.001 427.999 839.998 427.999 756 427.999C672.002 427.999 587.999 427.999 504.002 427.999C419.999 427.999 336.001 427.999 251.998 427.999C168.001 427.999 83.9977 427.999 0 427.999V145.937Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 179.98C83.9977 164.969 168.001 149.958 251.998 145.937C336.001 141.916 419.999 148.875 504.002 136.212C587.999 123.544 672.002 91.2545 756 102.169C839.998 113.083 924.001 167.206 1008 175.115C1092 183.025 1176 144.722 1260 126.483C1344 108.243 1428 110.068 1512 111.893V427.999C1428 427.999 1344 427.999 1260 427.999C1176 427.999 1092 427.999 1008 427.999C924.001 427.999 839.998 427.999 756 427.999C672.002 427.999 587.999 427.999 504.002 427.999C419.999 427.999 336.001 427.999 251.998 427.999C168.001 427.999 83.9977 427.999 0 427.999V179.98Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 165.391C83.9977 195.058 168.001 224.725 251.998 218.884C336.001 213.043 419.999 171.695 504.002 165.391C587.999 159.083 672.002 187.814 756 184.84C839.998 181.872 924.001 147.193 1008 150.802C1092 154.406 1176 196.293 1260 199.43C1344 202.571 1428 166.957 1512 131.348V428C1428 428 1344 428 1260 428C1176 428 1092 428 1008 428C924.001 428 839.998 428 756 428C672.002 428 587.999 428 504.002 428C419.999 428 336.001 428 251.998 428C168.001 428 83.9977 428 0 428V165.391Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 199.429C83.9977 171.46 168.001 143.486 251.998 141.072C336.001 138.657 419.999 161.802 504.002 184.84C587.999 207.883 672.002 230.824 756 223.748C839.998 216.667 924.001 179.568 1008 179.98C1092 180.387 1176 218.304 1260 223.748C1344 229.188 1428 202.149 1512 175.115V427.999C1428 427.999 1344 427.999 1260 427.999C1176 427.999 1092 427.999 1008 427.999C924.001 427.999 839.998 427.999 756 427.999C672.002 427.999 587.999 427.999 504.002 427.999C419.999 427.999 336.001 427.999 251.998 427.999C168.001 427.999 83.9977 427.999 0 427.999V199.429Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 209.16C83.9977 198.708 168.001 188.262 251.998 194.57C336.001 200.874 419.999 223.932 504.002 218.884C587.999 213.836 672.002 180.683 756 184.841C839.998 189.004 924.001 230.48 1008 252.928C1092 275.371 1176 278.792 1260 272.377C1344 265.967 1428 249.72 1512 233.474V428C1428 428 1344 428 1260 428C1176 428 1092 428 1008 428C924.001 428 839.998 428 756 428C672.002 428 587.999 428 504.002 428C419.999 428 336.001 428 251.998 428C168.001 428 83.9977 428 0 428V209.16Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 199.43C83.9977 208.387 168.001 217.339 251.998 238.338C336.001 259.338 419.999 292.38 504.002 282.106C587.999 271.828 672.002 218.233 756 214.019C839.998 209.805 924.001 254.971 1008 277.241C1092 299.512 1176 298.886 1260 296.695C1344 294.499 1428 290.733 1512 286.966V428C1428 428 1344 428 1260 428C1176 428 1092 428 1008 428C924.001 428 839.998 428 756 428C672.002 428 587.999 428 504.002 428C419.999 428 336.001 428 251.998 428C168.001 428 83.9977 428 0 428V199.43Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 340.463C83.9977 346.741 168.001 353.019 251.998 340.463C336.001 327.907 419.999 296.512 504.002 291.83C587.999 287.149 672.002 309.175 756 311.285C839.998 313.389 924.001 295.577 1008 282.106C1092 268.63 1176 259.495 1260 267.516C1344 275.533 1428 300.701 1512 325.874V427.999C1428 427.999 1344 427.999 1260 427.999C1176 427.999 1092 427.999 1008 427.999C924.001 427.999 839.998 427.999 756 427.999C672.002 427.999 587.999 427.999 504.002 427.999C419.999 427.999 336.001 427.999 251.998 427.999C168.001 427.999 83.9977 427.999 0 427.999V340.463Z" fill="#749AED" fillOpacity="0.19"/>
              <path d="M0 277.241C83.9977 281.364 168.001 285.486 251.998 296.695C336.001 307.899 419.999 326.189 504.002 335.599C587.999 345.008 672.002 345.542 756 350.188C839.998 354.834 924.001 363.598 1008 369.642C1092 375.686 1176 379.011 1260 364.777C1344 350.544 1428 318.757 1512 286.966V428C1428 428 1344 428 1260 428C1176 428 1092 428 1008 428C924.001 428 839.998 428 756 428C672.002 428 587.999 428 504.002 428C419.999 428 336.001 428 251.998 428C168.001 428 83.9977 428 0 428V277.241Z" fill="#749AED"/>
            </svg>
          </div>
        </section>

        <div id="newsContainer">
          <h2>ULTIMAS NOTICIAS</h2>
          <div id="news">
            <div className="spacer"></div>

            {isLoadingNews ? (
              <div style={{ padding: "40px", textAlign: "center", color: COLORS.black_01 }}>
                <p>Cargando noticias...</p>
              </div>
            ) : Array.isArray(news) && news.length > 0 ? (
              news.map((item) => {
                return (
                  <div 
                    className="newItem" 
                    key={item.id}
                    onClick={() => navigate(`/news/${item.id}`, { state: { news: item } })}
                    style={{ cursor: "pointer" }}
                  >
                    <p className="newTitle">{item.title}</p>
                    {getImageUrl(item.image) && (
                      <img src={getImageUrl(item.image)} alt={item.title} />
                    )}
                    <p className="newDate">hace {timeSince(item.created_at)}</p>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: COLORS.black_01 }}>
                <p>No hay noticias disponibles</p>
              </div>
            )}

            <div className="spacer"></div>
          </div>
          {Array.isArray(news) && news.length > 0 &&
            <button id="moreNewsButton" onClick={() => navigate("/news")}>
              <p>VER TODAS LAS<br/>NOTICIAS</p>
            </button>
          }
        </div>

        <section>
          <div className="content">
            <h2>PROXIMAS<br/>COMPETENCIAS</h2>
            <div className="line" style={{width: 209}}/>
            <p className="subTitle">Inscribite de manera simple</p>

            <div id="comptitions">

              {isLoadingMeets ? (
                <div id="competitionsLoadingContainer">
                  <p>Cargando competencias...</p>
                </div>
              ) : isErrorMeets ? (
                <div id="competitionsErrorContainer">
                  <div className="errorIcon">
                    <Icon name="info" size={48} color={COLORS.black_01} />
                  </div>
                  <div className="errorContent">
                    <p className="errorTitle">Error al cargar competencias</p>
                    <p className="errorMessage">Intenta recargar la página</p>
                  </div>
                </div>
              ) : Array.isArray(meets) && meets.length > 0 ? (
                meets.map((item, index) => {
                  return <button className="competitionItem" key={index} role="button" tabIndex={0} onClick={() => navigate(`/meet/${item.id}`)}>
                    <p className="competitionItemDate">{dateOnlyFormatter(item.date)}</p>
                    <p className="competitionItemTitle">{item.name}</p>
                    <div>
                      <p className="competitionItemLocation">{item.place_name}{item.place_description ? ` · ${item.place_description}` : ""}, {item.place_address}</p>
                      <p className="competitionItemTimeLeft">en {timeLeft(item.date)}</p>
                    </div>
                  </button>
                })
              ) : (
                <div id="competitionsEmptyContainer">
                  <div className="emptyIcon">
                    <Icon name="clock" size={64} color={COLORS.black_01} />
                  </div>
                  <div className="emptyContent">
                    <p className="emptyTitle">No hay competencias próximas</p>
                    <p className="emptyMessage">Próximamente se publicarán nuevas competencias</p>
                  </div>
                </div>
              )}

              <button id="moreCompetitions" role="button" tabIndex={0} onClick={() => navigate("/meets")}>
                <p>VER TODAS LAS<br/>COMPETENCIAS</p>
              </button>

            </div>
          </div>

          <div className="endLines">
            <div className="bottomLine primary"/>
            <div className="bottomLine secondary"/>
            <div className="bottomLine thirdy"/>
          </div>
        </section>

        <section className="black">
          <div className="content">
            <h2>RESULTADOS</h2>
            <div className="line" style={{width: 209}}/>
            <p className="subTitle">Tiempos - Marcas</p>

            <div id="results">
              {isLoadingMeetsWithResults ? (
                <div className="resultsLoading">
                  <p>Cargando resultados...</p>
                </div>
              ) : Array.isArray(meetsWithResults) && meetsWithResults.length > 0 ? (
                <>
                  {meetsWithResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="resultItem"
                      onClick={() => navigate(`/meet/${item.id}/results`)}
                    >
                      <p className="resultItemTitle">{item.name}</p>
                      <p className="resultItemDate">{dateOnlyFormatter(item.date)}</p>
                      <p className="resultItemLocation">{item.place_name}{item.place_description ? ` · ${item.place_description}` : ""}, {item.place_address}</p>
                      <div className="resultIconContainer">
                        <Icon name="right-arrow" size={24} color={COLORS.black_01} />
                      </div>
                    </button>
                  ))}
                  <div id="moreResultsGuide">
                    <button type="button" id="moreResults" onClick={() => navigate("/results")}>
                      <p>VER TODOS LOS<br/>RESULTADOS</p>
                    </button>
                  </div>
                </>
              ) : (
                <div id="resultsUnderConstructionContainer">
                  <p className="constructionMessage">Aún no hay resultados publicados</p>
                  <div id="moreResultsGuide">
                    <button type="button" id="moreResults" onClick={() => navigate("/results")}>
                      <p>VER RESULTADOS</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </section>

        <section className="orange">

          <div className="content">
            <div id="rankingHeader">
              <h2>RANKING</h2>
              <div className="line" style={{width: 128}}/>
              <p className="subTitle">Mejores Marcas FAM</p>
            </div>

            <div id="statsContainer">
              {isLoadingStats ? (
                <div style={{ 
                  gridColumn: "1 / -1", 
                  textAlign: "center", 
                  padding: "40px",
                  color: COLORS.black_01 
                }}>
                  <p>Cargando estadísticas...</p>
                </div>
              ) : (
                <>
                  <div className="statCard">
                    <div className="statIcon">
                      <Icon name="users-group" size={32} color={COLORS.black_01} />
                    </div>
                    <div className="statContent">
                      <p className="statNumber">{statsData.totalAthletes.toLocaleString()}</p>
                      <p className="statLabel">Atletas Registrados</p>
                    </div>
                  </div>

                  <div className="statCard">
                    <div className="statIcon">
                      <Icon name="user-check" size={32} color={COLORS.black_01} />
                    </div>
                    <div className="statContent">
                      <p className="statNumber">{statsData.activeAthletes.toLocaleString()}</p>
                      <p className="statLabel">Atletas Activos</p>
                    </div>
                  </div>

                  <div className="statCard">
                    <div className="statIcon">
                      <Icon name="tag" size={32} color={COLORS.black_01} />
                    </div>
                    <div className="statContent">
                      <p className="statNumber">{statsData.totalMarks.toLocaleString()}</p>
                      <p className="statLabel">Marcas Registradas</p>
                    </div>
                  </div>

                  <div className="statCard">
                    <div className="statIcon">
                      <Icon name="clock" size={32} color={COLORS.black_01} />
                    </div>
                    <div className="statContent">
                      <p className="statNumber">{statsData.currentYearMarks.toLocaleString()}</p>
                      <p className="statLabel">Marcas {displayYear}</p>
                    </div>
                  </div>

                  <div className="statCard">
                    <div className="statIcon">
                      <Icon name="map" size={32} color={COLORS.black_01} />
                    </div>
                    <div className="statContent">
                      <p className="statNumber">{statsData.uniqueClubs.toLocaleString()}</p>
                      <p className="statLabel">Clubs Afiliados</p>
                    </div>
                  </div>

                  <div className="statCard highlight" onClick={() => navigate("/ranking")} style={{ cursor: "pointer" }}>
                    <div className="statIcon">
                      <Icon name="right-arrow" size={32} color={COLORS.black_01} />
                    </div>
                    <div className="statContent">
                      <p className="statLabel" style={{ fontWeight: 700, fontSize: SIZES.f4 }}>
                        VER RANKING<br/>COMPLETO
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </section>

        <footer>
          <p>WEBFAM - {new Date().getFullYear()}</p>
        </footer>
      </main>

      <BankingDataModal 
        isOpen={isBankingModalOpen} 
        onClose={() => setIsBankingModalOpen(false)} 
      />
    </div>
  )
}

export default Transition(Home);