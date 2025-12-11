import disciplinesTypes from "../json/disciplinesTypes.json";
import disciplineOptions from "../json/disciplines.json";
import "material-react-toastify/dist/ReactToastify.css";
import categoryOptions from "../json/categories.json";
import RankingTable from "../components/RankingTable";
import { COLORS, SIZES } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import genderOptions from "../json/genders.json";
import { useNavigate } from "react-router-dom";
import { makeRequest } from "../config/axios";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import { motion } from "framer-motion";
import Select from "react-select";

const customStyles = {
  container: (base) => ({
    ...base,
    minWidth: "100%",
    width: "100%",
  }),
  control: (base, state) => ({
    ...base,
    backgroundColor: COLORS.black_01,
    borderColor: COLORS.black_01,
    padding: "8px 12px",
    minHeight: "54px",
    boxShadow: "none",
    minWidth: "100%",
    borderRadius: 0,
    outline: "none",
    borderWidth: 1,
    width: "100%",
    "&:hover": {
      borderColor: COLORS.black_01,
    },
  }),
  valueContainer: (base) => ({
    ...base,
    justifyContent: "flex-start",
    alignContent: "center",
    alignItems: "center",
    flexWrap: "nowrap",
    lineHeight: 1.2,
    columnGap: 0,
    padding: 0,
    margin: 0,
    rowGap: 0,
    gap: 0,
  }),
  singleValue: (base) => ({
    ...base,
    color: COLORS.orange_01,
    fontWeight: 600,
    fontSize: SIZES.f5,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: COLORS.orange_01,
    padding: "4px",
  }),
  placeholder: (base) => ({
    ...base,
    color: COLORS.white_02,
    fontSize: SIZES.f5,
    fontWeight: 400,
    margin: 0,
  }),
  menu: (base) => ({
    ...base,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    border: `1px solid ${COLORS.black_01}`,
    backgroundColor: COLORS.white_01,
    borderRadius: "12px",
    overflow: "hidden",
    zIndex: 1000,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? COLORS.orange_01 : COLORS.white_01,
    color: state.isFocused ? COLORS.white_01 : COLORS.black_01,
    fontWeight: 600,
    fontSize: SIZES.f5,
    padding: "8px 12px",
    cursor: "pointer",
    ":active": {
      backgroundColor: COLORS.orange_01,
      color: COLORS.white_01,
    }
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

  const [disciplineType, setDisciplineType] = useState(disciplinesTypes[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchParams, setSearchParams] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [discipline, setDiscipline] = useState(null);
  const [categories, setCategories] = useState([]);
  const [gender, setGender] = useState(1);

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const yearValue = new Date().getFullYear() - i;
    return { value: yearValue, label: yearValue.toString() };
  });

  const filteredDisciplines = disciplineType ? disciplineOptions.filter(discipline => discipline.type === disciplineType.value) : [];

  const { data: ranking, isLoading: isLoadingRanking, isError: isErrorRanking, isRefetching: isRefetchingRanking, error } = useQuery({
    queryFn: () => makeRequest.get("/results/ranking", { params: searchParams }).then((res) => res.data),
    queryKey: ["ranking", searchParams],
    enabled: !!searchParams,
  });

  useEffect(() => {
    if (disciplineType && filteredDisciplines.length > 0 && !discipline) setDiscipline(filteredDisciplines[0]);
  }, [disciplineType, filteredDisciplines, discipline]);

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

  const handleDisciplineTypeChange = (selectedType) => {
    setDisciplineType(selectedType);
    const newFilteredDisciplines = disciplineOptions.filter(discipline => discipline.type === selectedType.value);
    if (newFilteredDisciplines.length > 0) setDiscipline(newFilteredDisciplines[0]);
    else setDiscipline(null);
  };

  const handleSearch = () => {
    if (discipline) {
      setShowLoader(true);
      setSearchParams({ year, gender, discipline: discipline.value, categories: JSON.stringify(categories) });
      
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
                styles={customStyles}
                isSearchable={false}
              />

              <Select
                placeholder="Tipo de Disciplina"
                options={disciplinesTypes}
                onChange={handleDisciplineTypeChange}
                styles={customStyles}
                isSearchable={false}
                value={disciplineType}
              />

              <Select
                placeholder="Selecciona disciplina"
                options={filteredDisciplines}
                onChange={setDiscipline}
                styles={customStyles}
                isSearchable={false}
                value={discipline}
              />
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

          {isLoadingRanking || isRefetchingRanking || showLoader ?
            <div className="noTableContainer">
              <SearchLoader text="Cargando ranking..." />
            </div>
          : ranking && ranking?.length > 0 ?
            <RankingTable
              toShowColumns={[
                { key: "position", label: "#", align: "center", fixed: true, bold: true, minWidth: 64 },
                { key: "best_mark", label: "Marca", align: "right", fixed: true, },
                { key: "athlete_name", label: "Atleta", align: "left", bold: true },
                { key: "athlete_born", label: "FDN", align: "right" },
                { key: "club_alias", label: "Club", align: "left" },
                { key: "date", label: "Fecha", align: "left" },
                { key: "place", label: "Lugar", align: "right" },
              ]}
              highlightedColor={COLORS.orange_01}
              authState={authState}
              main="athlete_id"
              data={ranking}
            />
          : 
            <div className="noTableContainer">
              <p>Aún <strong>no hay ranking</strong>!</p>
            </div>
          }
        </section>
      </main>

    </div>
  )
}

export default Transition(Ranking);