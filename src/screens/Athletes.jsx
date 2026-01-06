import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import Select from 'react-select';
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import { profileImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";

function Athletes() {
  useEffect(() => {import("./styles/athletes.scss")}, []);

  const navigate = useNavigate();

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  // Función para obtener atletas con filtros
  const fetchAthletes = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams({
      page: pageParam,
      limit: 20,
      search: searchTerm,
      club: clubFilter,
      gender: genderFilter || "",
      category: categoryFilter || ""
    });

    const response = await makeRequest.get(`/users/athletes?${params}`);
    return response.data;
  };

  // Infinite Query para atletas
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['athletes', searchTerm, clubFilter, genderFilter, categoryFilter],
    queryFn: fetchAthletes,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Función para manejar scroll infinito
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop
      >= document.documentElement.offsetHeight - 1000
      && hasNextPage
      && !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Función para aplicar filtros
  const applyFilters = () => {
    refetch();
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setClubFilter("");
    setGenderFilter(null);
    setCategoryFilter(null);
    refetch(); // Refrescar la query inmediatamente
  };

  // Función para navegar al detalle del atleta
  const handleAthleteClick = (athleteId) => {
    navigate(`/athlete/${athleteId}`);
  };

  // Opciones para los select
  const genderOptions = [
    { value: "1", label: "Hombres" },
    { value: "2", label: "Mujeres" }
  ];

  const categoryOptions = [
    { value: "1", label: "U12 (0-11 años)" },
    { value: "2", label: "U14 (12-13 años)" },
    { value: "3", label: "U16 (14-15 años)" },
    { value: "4", label: "U18 (16-17 años)" },
    { value: "5", label: "U20 (18-19 años)" },
    { value: "6", label: "U23 (20-22 años)" },
    { value: "7", label: "Mayores (23+ años)" }
  ];

  // Estilos personalizados para react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      padding: '2px',
      border: `1px solid ${state.isFocused ? '#749AED' : '#7D7D7D'}`,
      borderRadius: '8px',
      backgroundColor: '#EEF0FA',
      fontSize: '16px',
      minHeight: '44px',
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

  return (
    <div id="Athletes">
      <NavBar />

      <main>
        {/* Filtros */}
        <section id="filtersSection">
          <div id="filtersContainer">
            <h2>Buscar Atletas</h2>

            <div id="filtersGrid">
              {/* Búsqueda por nombre */}
              <div className="filterGroup">
                <label>Buscar por nombre</label>
                <input
                  type="text"
                  placeholder="Nombre del atleta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>

              {/* Filtro por club */}
              <div className="filterGroup desktop-only">
                <label>Club</label>
                <input
                  type="text"
                  placeholder="Nombre o alias del club..."
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>

              {/* Filtro por género */}
              <div className="filterGroup desktop-only">
                <label>Género</label>
                <Select
                  value={genderFilter ? genderOptions.find(option => option.value === genderFilter) : null}
                  onChange={(option) => setGenderFilter(option ? option.value : null)}
                  options={genderOptions}
                  isClearable
                  placeholder="Seleccionar género..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={selectStyles}
                />
              </div>

              {/* Filtro por categoría */}
              <div className="filterGroup desktop-only">
                <label>Categoría</label>
                <Select
                  value={categoryFilter ? categoryOptions.find(option => option.value === categoryFilter) : null}
                  onChange={(option) => setCategoryFilter(option ? option.value : null)}
                  options={categoryOptions}
                  isClearable
                  placeholder="Seleccionar categoría..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={selectStyles}
                />
              </div>
            </div>

            <div id="filterActions" className="desktop-only">
              <button className="clearButton" onClick={clearFilters}>
                Limpiar filtros
              </button>
              <button className="applyButton" onClick={applyFilters}>
                Buscar
              </button>
            </div>
          </div>
        </section>

        {/* Lista de atletas */}
        <section id="athletesSection">
          {isLoading ? (
            <div className="loadingContainer">
              <p>Cargando atletas...</p>
            </div>
          ) : isError ? (
            <div className="errorContainer">
              <p>Error al cargar atletas. Inténtalo de nuevo.</p>
              <button onClick={refetch}>Reintentar</button>
            </div>
          ) : (
            <>
              <div id="athletesCount">
                <p>
                  {data?.pages[0]?.pagination?.total || 0} atletas encontrados
                </p>
              </div>

              <div id="athletesGrid">
                {data?.pages.map((page) =>
                  page.athletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className="athleteCard"
                      onClick={() => handleAthleteClick(athlete.id)}
                    >
                      <div className="athleteImage">
                        <img
                          src={profileImageGetter(athlete.image)}
                          alt={athlete.name}
                        />
                      </div>

                      <div className="athleteInfo">
                        <h3>{athlete.name}</h3>
                        <p className="athleteCategory">
                          {categoryGetter(athlete.born)}
                        </p>
                        <p className="athleteClub">
                          {athlete.club_name ? (athlete.club_name.length > 25 ? athlete.club_name.substring(0, 25) + '...' : athlete.club_name) : 'Sin club'}
                        </p>
                        <div className="athleteGender">
                          <Icon
                            name="user"
                            size={16}
                            color={COLORS.white_02}
                          />
                          <span>{athlete.gender === 1 ? 'Hombre' : 'Mujer'}</span>
                        </div>
                      </div>

                      <div className="athleteActions">
                        <Icon name="right-arrow" size={20} color={COLORS.white_02} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Loading más atletas */}
              {isFetchingNextPage && (
                <div className="loadingMore">
                  <p>Cargando más atletas...</p>
                </div>
              )}

              {/* Fin de la lista */}
              {!hasNextPage && data?.pages[0]?.athletes?.length > 0 && (
                <div className="endOfList">
                  <p>No hay más atletas para mostrar</p>
                </div>
              )}

              {/* Sin resultados */}
              {data?.pages[0]?.athletes?.length === 0 && (
                <div className="noResults">
                  <Icon name="search" size={48} color={COLORS.white_02} />
                  <h3>No se encontraron atletas</h3>
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

export default Transition(Athletes);
