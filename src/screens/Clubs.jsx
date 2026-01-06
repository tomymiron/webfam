import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import { clubImageGetter } from "../constants/imageGetter";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";

function Clubs() {
  useEffect(() => {import("./styles/clubs.scss")}, []);

  const navigate = useNavigate();
  const observerTarget = useRef(null);

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState("");

  // Función para obtener clubes con filtros
  const fetchClubs = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: pageParam,
      limit: 20,
      search: searchTerm
    });

    const response = await makeRequest.get(`/clubs?${params}`);
    return response.data;
  };

  // Infinite Query para clubes
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['clubs', searchTerm],
    queryFn: fetchClubs,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Función para manejar el IntersectionObserver
  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Configurar IntersectionObserver para infinite scroll
  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  // Función para aplicar filtros
  const applyFilters = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refetch();
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para navegar al detalle del club
  const handleClubClick = (clubId) => {
    navigate(`/club-detail/${clubId}`);
  };

  return (
    <div id="Clubs">
      <NavBar />

      <main>
        {/* Filtros */}
        <section id="filtersSection">
          <div id="filtersContainer">
            <h2>Buscar Clubes</h2>

            <div id="filtersGrid">
              {/* Búsqueda por nombre */}
              <div className="filterGroup">
                <label>Buscar por nombre o alias</label>
                <input
                  type="text"
                  placeholder="Nombre del club..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
            </div>

            <div id="filterActions">
              <button className="clearButton" onClick={clearFilters}>
                Limpiar filtros
              </button>
              <button className="applyButton" onClick={applyFilters}>
                Buscar
              </button>
            </div>
          </div>
        </section>

        {/* Lista de clubes */}
        <section id="clubsSection">
          {isLoading ? (
            <div className="loadingContainer">
              <p>Cargando clubes...</p>
            </div>
          ) : isError ? (
            <div className="errorContainer">
              <p>Error al cargar clubes. Inténtalo de nuevo.</p>
              <button onClick={refetch}>Reintentar</button>
            </div>
          ) : (
            <>
              <div id="clubsCount">
                <p>
                  {data?.pages[0]?.pagination?.total || 0} clubes encontrados
                </p>
              </div>

              <div id="clubsGrid">
                {data?.pages.map((page) =>
                  page.clubs.map((club) => (
                    <div
                      key={club.id}
                      className="clubCard"
                      onClick={() => handleClubClick(club.id)}
                    >
                      <div className="clubImage">
                        <img
                          src={clubImageGetter(club.image)}
                          alt={club.name}
                        />
                      </div>

                      <div className="clubInfo">
                        <h3>{club.name}</h3>
                        <p className="clubAlias">
                          {club.alias || 'Sin alias'}
                        </p>
                        <div className="clubStats">
                          <Icon
                            name="users-group"
                            size={16}
                            color={COLORS.white_02}
                          />
                          <span>{club.athletes_count || 0} atletas</span>
                        </div>
                      </div>

                      <div className="clubActions">
                        <Icon name="right-arrow" size={20} color={COLORS.white_02} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Elemento de referencia para el IntersectionObserver */}
              {hasNextPage && (
                <div ref={observerTarget} style={{ width: "100%", height: "20px", marginTop: "20px" }}>
                  {isFetchingNextPage && (
                    <div className="loadingMore">
                      <p>Cargando más clubes...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Fin de la lista */}
              {!hasNextPage && data?.pages[0]?.clubs?.length > 0 && (
                <div className="endOfList">
                  <p>No hay más clubes para mostrar</p>
                </div>
              )}

              {/* Sin resultados */}
              {data?.pages[0]?.clubs?.length === 0 && (
                <div className="noResults">
                  <Icon name="search" size={48} color={COLORS.white_02} />
                  <h3>No se encontraron clubes</h3>
                  <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Transition(Clubs);

