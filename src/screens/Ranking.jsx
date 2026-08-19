import "material-react-toastify/dist/ReactToastify.css";
import categoryOptions from "../json/categories.json";
import RankingTable from "../components/RankingTable";
import { COLORS, SIZES } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import genderOptions from "../json/genders.json";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../config/axios";
import { useEffect, useState, useMemo } from "react";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import { motion } from "framer-motion";
import Select from "react-select";

const formatWeightLabel = (grams) => {
  if (grams == null) return "";
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${grams} g`;
};

const customSelectStyles = {
  container: (base) => ({
    ...base,
    minWidth: "100%",
    width: "100%",
  }),
  control: (base) => ({
    ...base,
    backgroundColor: COLORS.black_01,
    borderColor: COLORS.black_01,
    borderWidth: "2px",
    padding: "4px 8px",
    minHeight: "54px",
    boxShadow: "none",
    borderRadius: 0,
    "&:hover": {
      borderColor: COLORS.black_01,
    },
  }),
  input: (base) => ({
    ...base,
    color: COLORS.white_01,
  }),
  singleValue: (base) => ({
    ...base,
    color: COLORS.orange_01,
    fontWeight: 600,
    fontSize: SIZES.f5,
  }),
  placeholder: (base) => ({
    ...base,
    color: COLORS.white_02,
    opacity: 0.5,
    fontSize: SIZES.f5,
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: COLORS.white_01,
    borderRadius: 0,
    border: `2px solid ${COLORS.black_01}`,
    zIndex: 1000,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? COLORS.orange_01 : COLORS.white_01,
    color: COLORS.black_01,
    fontWeight: 600,
    fontSize: SIZES.f5,
    padding: "12px 16px",
    cursor: "pointer",
    "&:active": {
      backgroundColor: COLORS.orange_01,
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: COLORS.orange_01,
    "&:hover": {
      color: COLORS.orange_01,
    },
  }),
};

const SearchLoader = ({ text = "BUSCAR" }) => (
  <motion.div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <motion.div
      style={{
        width: '12px',
        height: '12px',
        border: '2px solid currentColor',
        borderTop: '2px solid transparent',
        borderRadius: '50%'
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    {text}
  </motion.div>
);

function Ranking() {
  useEffect(() => {import("./styles/ranking.scss")}, []);
  const { authState } = useAuth();
  const navigate = useNavigate();

  // Obtener disciplinas desde la API
  const { data: disciplinesData, isLoading: isLoadingDisciplines } = useQuery({
    queryFn: () => makeRequest.get("/results/disciplines").then((res) => res.data),
    queryKey: ["disciplines"],
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
  });

  // Transformar datos de disciplinas para tipos y opciones
  const disciplinesTypes = useMemo(() => {
    if (!disciplinesData || disciplinesData.length === 0) return [];
    const uniqueTypes = [...new Set(disciplinesData.map(d => d.type).filter(Boolean))];
    return uniqueTypes.map((type, index) => ({
      value: type,
      label: type
    }));
  }, [disciplinesData]);

  const disciplineOptions = useMemo(() => {
    if (!disciplinesData || disciplinesData.length === 0) return [];
    return disciplinesData.map(d => ({
      value: d.id,
      label: d.alias || d.name,
      type: d.type,
      isWeight: d.isWeight,
    }));
  }, [disciplinesData]);

  const [disciplineType, setDisciplineType] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchParams, setSearchParams] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [discipline, setDiscipline] = useState(null);
  const [categories, setCategories] = useState([]);
  const [weights, setWeights] = useState([]);
  const [gender, setGender] = useState(1);

  const disciplineUsesWeights = discipline?.isWeight === 1;

  const { data: disciplineWeightsData, isLoading: isLoadingWeights } = useQuery({
    queryFn: () => makeRequest.get(`/results/disciplines/${discipline.value}/weights`).then((res) => res.data),
    queryKey: ["discipline-weights", discipline?.value],
    enabled: !!discipline && disciplineUsesWeights,
    staleTime: 1000 * 60 * 60,
  });

  const weightOptions = useMemo(() => {
    if (!disciplineWeightsData || disciplineWeightsData.length === 0) return [];
    return disciplineWeightsData.map(w => ({
      value: w.id,
      label: w.label || formatWeightLabel(w.weight),
    }));
  }, [disciplineWeightsData]);

  const yearOptions = (() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2016;
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push({ value: year, label: year.toString() });
    }
    return years;
  })();

  // Establecer defaults: tipo "Velocidad" y disciplina "100m"
  useEffect(() => {
    if (disciplinesTypes.length > 0 && !disciplineType) {
      // Buscar "Velocidad" como tipo por defecto
      const velocidadType = disciplinesTypes.find(type => type.value === "Velocidad");
      setDisciplineType(velocidadType || disciplinesTypes[0]);
    }
  }, [disciplinesTypes, disciplineType]);

  const filteredDisciplines = disciplineType ? disciplineOptions.filter(discipline => discipline.type === disciplineType.value) : [];

  // Establecer "100m" como disciplina por defecto cuando se carga el tipo "Velocidad"
  useEffect(() => {
    if (disciplineType && disciplineType.value === "Velocidad" && filteredDisciplines.length > 0 && !discipline) {
      // Buscar "100m" en las disciplinas filtradas
      const cienMetros = filteredDisciplines.find(d => d.label === "100m" || d.value === 1);
      setDiscipline(cienMetros || filteredDisciplines[0]);
    } else if (disciplineType && disciplineType.value !== "Velocidad" && filteredDisciplines.length > 0 && !discipline) {
      // Para otros tipos, seleccionar la primera disciplina
      setDiscipline(filteredDisciplines[0]);
    }
  }, [disciplineType, filteredDisciplines, discipline]);

  const { data: ranking, isLoading: isLoadingRanking, isError: isErrorRanking, isRefetching: isRefetchingRanking, error } = useQuery({
    queryFn: () => makeRequest.get("/results/ranking", { params: searchParams }).then((res) => res.data),
    queryKey: ["ranking", searchParams],
    enabled: !!searchParams,
    refetchOnWindowFocus: false,
  });

  // Este efecto ya no es necesario, se maneja en el efecto anterior

  // Ejecutar búsqueda automática cuando se establece la disciplina inicial
  useEffect(() => {
    if (discipline && !searchParams) {
      // Ejecutar búsqueda automática con valores por defecto la primera vez que se carga
      setSearchParams({ year, gender, discipline: discipline.value, categories: JSON.stringify(categories) });
    }
  }, [discipline]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoadingRanking && !isRefetchingRanking && showLoader) {
      const timer = setTimeout(() => { setShowLoader(false); }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoadingRanking, isRefetchingRanking, showLoader]);

  const handleCategoryToggle = (categoryValue) => {
    setCategories(prev => {
      if (prev.includes(categoryValue)) return prev.filter(cat => cat !== categoryValue);
      else return [...prev, categoryValue];
    });
  };

  const handleWeightToggle = (weightValue) => {
    setWeights(prev => {
      if (prev.includes(weightValue)) return prev.filter(w => w !== weightValue);
      else return [...prev, weightValue];
    });
  };

  const handleDisciplineChange = (selectedDiscipline) => {
    setDiscipline(selectedDiscipline);
    setWeights([]);
  };

  const handleDisciplineTypeChange = (selectedType) => {
    setDisciplineType(selectedType);
    setWeights([]);
    const newFilteredDisciplines = disciplineOptions.filter(discipline => discipline.type === selectedType.value);
    if (newFilteredDisciplines.length > 0) {
      // Si es "Velocidad", buscar "100m", sino seleccionar la primera
      if (selectedType.value === "Velocidad") {
        const cienMetros = newFilteredDisciplines.find(d => d.label === "100m" || d.value === 1);
        setDiscipline(cienMetros || newFilteredDisciplines[0]);
      } else {
        setDiscipline(newFilteredDisciplines[0]);
      }
    } else {
      setDiscipline(null);
    }
  };

  const handleSearch = () => {
    if (discipline) {
      setShowLoader(true);
      setSearchParams({
        year,
        gender,
        discipline: discipline.value,
        categories: JSON.stringify(categories),
        ...(disciplineUsesWeights ? { weights: JSON.stringify(weights) } : {}),
      });

      setTimeout(() => { setShowLoader(false); }, 1000);
    }
  };

  return (
    <div id="Ranking">
      <NavBar backgroundColor={COLORS.orange_01} />

      <main>
        <section>
          <div id="rankingHeader">
            <p id="rankingTitle">RANKING</p>
            <div id="rankingSeparator" />
            <p id="rankingSubTitle">Mejores Marcas FAM {new Date().getFullYear()}</p>
          </div>

          <div id="rankingFilters">
            <div id="leftColumn">
              <Select
                value={yearOptions.find(option => option.value === year)}
                onChange={(option) => setYear(option.value)}
                placeholder="Selecciona año"
                options={yearOptions}
                styles={customSelectStyles}
                isSearchable={false}
                className="react-select-container"
                classNamePrefix="react-select"
              />

              <Select
                placeholder={isLoadingDisciplines ? "Cargando tipos..." : "Tipo de Disciplina"}
                options={disciplinesTypes}
                onChange={handleDisciplineTypeChange}
                styles={customSelectStyles}
                isSearchable={true}
                value={disciplineType}
                isLoading={isLoadingDisciplines}
                isDisabled={isLoadingDisciplines}
                className="react-select-container"
                classNamePrefix="react-select"
              />

              <Select
                placeholder={isLoadingDisciplines ? "Cargando disciplinas..." : "Selecciona disciplina"}
                options={filteredDisciplines}
                onChange={handleDisciplineChange}
                styles={customSelectStyles}
                isSearchable={true}
                value={discipline}
                isLoading={isLoadingDisciplines}
                isDisabled={isLoadingDisciplines || !disciplineType}
                className="react-select-container"
                classNamePrefix="react-select"
              />

              {disciplineUsesWeights && (
                <div id="weightsContainer">
                  {isLoadingWeights ? (
                    <p className="weightsHint">Cargando implementos...</p>
                  ) : weightOptions.length === 0 ? (
                    <p className="weightsHint">Sin implementos cargados</p>
                  ) : (
                    weightOptions.map((weight) => (
                      <button
                        key={weight.value}
                        className={`weightButton ${weights.includes(weight.value) ? 'selected' : ''}`}
                        onClick={() => handleWeightToggle(weight.value)}
                      >
                        {weight.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div id="rightColumn">
              <div id="genderSelection">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`genderButton ${gender === option.value ? 'selected' : ''}`}
                    onClick={() => setGender(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div id="categoriesContainer">
                {categoryOptions.map((category) => (
                  <button
                    key={category.value}
                    className={`categoryButton ${categories.includes(category.value) ? 'selected' : ''}`}
                    onClick={() => handleCategoryToggle(category.value)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.button 
            id="searchButton" 
            onClick={handleSearch}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {showLoader || isLoadingRanking || isRefetchingRanking ? <SearchLoader />: "BUSCAR" }
          </motion.button>

          <div id="rankingTableContainer">
          {isLoadingRanking || isRefetchingRanking || showLoader ?
            <div className="noTableContainer">
              <SearchLoader text="Cargando ranking..." />
            </div>
          : (ranking && Array.isArray(ranking) && ranking.length > 0) ?
            (() => {
              // Construir columnas dinámicamente basándose en los datos de la disciplina
              const baseColumns = [
                { key: "position", label: "#", align: "center", fixed: true, bold: true, minWidth: 50 },
                { key: "best_mark", label: "Marca", align: "right", fixed: true, },
                { key: "athlete_name", label: "Atleta", align: "left", bold: true },
                { key: "athlete_born", label: "FDN", align: "right" },
                { key: "club_alias", label: "Club", align: "left" },
              ];
              
              // Verificar si la disciplina requiere wind o weight usando isWind e isWeight
              const firstRow = ranking[0];
              const showWind = firstRow?.isWind === 1;
              const showWeight = firstRow?.isWeight === 1;
              
              // Agregar columnas si la disciplina las requiere
              if (showWind) {
                baseColumns.push({ key: "wind", label: "Viento", align: "right" });
              }
              
              if (showWeight) {
                const searchedDiscipline = disciplineOptions.find(d => d.value === searchParams?.discipline);
                const isHurdles = /c\/v/i.test(searchedDiscipline?.label || "");
                baseColumns.push({ key: "weight", label: isHurdles ? "Valla" : "Peso", align: "right" });
              }
              
              // Agregar el resto de columnas
              baseColumns.push(
                { key: "date", label: "Fecha", align: "left" },
                { key: "place", label: "Lugar", align: "right" }
              );
              
              return (
                <RankingTable
                  toShowColumns={baseColumns}
                  highlightedColor={COLORS.orange_01}
                  authState={authState}
                  main="athlete_id"
                  data={ranking}
                />
              );
            })()
          : (searchParams && !isLoadingRanking && !isRefetchingRanking) ?
            <div className="noTableContainer">
              <p>Aún <strong>no hay ranking</strong>!</p>
            </div>
          : null
          }
          </div>
        </section>
      </main>

    </div>
  )
}

export default Transition(Ranking);