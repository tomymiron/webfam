import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Select from 'react-select';
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import AthleteResultItem from "../components/results/AthleteResultItem";
import { profileImageGetter, clubImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";

function AthleteDetail() {
  useEffect(() => {import("./styles/athleteDetail.scss")}, []);

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedYear, setSelectedYear] = useState(null);

  // Query para obtener datos del atleta
  const { data: athleteData, isLoading, isError, refetch } = useQuery({
    queryKey: ['athlete', id],
    queryFn: async () => {
      const response = await makeRequest.get(`/users/athlete/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener mejores marcas de un año específico
  const { data: yearResultsData, refetch: refetchYearResults } = useQuery({
    queryKey: ['athlete-year-results', id, selectedYear],
    queryFn: async () => {
      if (!selectedYear) return [];
      const response = await makeRequest.get(`/users/athlete/${id}/year/${selectedYear}`);
      return response.data.yearResults || [];
    },
    enabled: !!id && !!selectedYear,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Establecer el año seleccionado cuando se carga la data
  useEffect(() => {
    if (athleteData?.selectedYear && !selectedYear) {
      setSelectedYear(athleteData.selectedYear);
    }
  }, [athleteData, selectedYear]);

  const handleBack = () => {
    // Si hay historial para volver atrás (más de 1 página), ir atrás
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Si no hay historial, ir a la página de atletas
      navigate('/athletes');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    // Parsear fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque Date usa 0-based

    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAge = (bornDate) => {
    if (!bornDate) return 'N/A';

    // Parsear fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = bornDate.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return `${age} años`;
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
  const yearOptions = athleteData?.availableYears?.map(year => ({
    value: year,
    label: `${year} (${getCategoryForYear(athleteData.athlete?.born, year)})`
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

  if (isLoading) {
    return (
      <div id="AthleteDetail">
        <NavBar />
        <main>
          <div className="loadingContainer">
            <p>Cargando atleta...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !athleteData) {
    return (
      <div id="AthleteDetail">
        <NavBar />
        <main>
          <div className="errorContainer">
            <Icon name="close" size={48} color={COLORS.red_01} />
            <h3>Error al cargar atleta</h3>
            <p>No se pudo encontrar la información del atleta solicitado.</p>
            <div className="errorActions">
              <button onClick={refetch}>Reintentar</button>
              <button onClick={handleBack}>Volver</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { athlete, bestResults, latestResults } = athleteData;

  return (
    <div id="AthleteDetail">
      <NavBar />

      <main>
        {/* Botón de volver */}
        <section id="backSection">
          <button className="backButton" onClick={handleBack} aria-label="Volver">
            <Icon name="left-arrow" size={24} color={COLORS.white_02} />
          </button>
        </section>

        {/* Información del atleta */}
        <section id="athleteInfoSection">
          <div id="athleteProfile">
            <div id="athleteImage">
              <img src={profileImageGetter(athlete.image)} alt={athlete.name} />
            </div>

            <div id="athleteDetails">
              <h1>{athlete.name}</h1>
              <div className="athleteMeta">
                <div className="metaItem">
                  <Icon name="cake" size={16} color={COLORS.white_02} />
                  <span>{formatDate(athlete.born)} ({formatAge(athlete.born)})</span>
                </div>
                <div className="metaItem">
                  <Icon name="user" size={16} color={COLORS.white_02} />
                  <span>{athlete.gender === 1 ? 'Hombre' : 'Mujer'}</span>
                </div>
                <div className="metaItem">
                  <Icon name="tag" size={16} color={COLORS.white_02} />
                  <span>{categoryGetter(athlete.born)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información del club */}
          {athlete.club_name && (
            <div id="clubInfo">
              <h3>Club</h3>
              <div className="clubCard">
                <div className="clubImage">
                  <img src={clubImageGetter(athlete.club_image)} alt={athlete.club_name} />
                </div>
                <div className="clubDetails">
                  <h4>{athlete.club_name}</h4>
                  <p>{athlete.club_alias}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Mejores marcas */}
        <section id="resultsSection">
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

            {selectedYear && (yearResultsData || athleteData?.yearResults) ? (
              <div className="resultsList">
                {(yearResultsData || athleteData.yearResults).map((result) => (
                  <AthleteResultItem
                    key={result.id}
                    event={result.discipline_name}
                    unit={result.unit}
                    result={result.result}
                    date={result.date}
                    location={result.place_name}
                    wind={result.wind}
                    weight={result.weight}
                    isWind={result.isWind}
                    isWeight={result.isWeight}
                  />
                ))}
              </div>
            ) : selectedYear ? (
              <div className="noResults">
                <Icon name="calendar" size={32} color={COLORS.white_02} />
                <p>No hay marcas registradas en {selectedYear}</p>
              </div>
            ) : (
              <div className="noResults">
                <Icon name="calendar" size={32} color={COLORS.white_02} />
                <p>Selecciona un año para ver las mejores marcas</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Transition(AthleteDetail);
