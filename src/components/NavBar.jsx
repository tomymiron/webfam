import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { COLORS } from "../constants/theme";
import Sidebar from "./sidebar/Sidebar";
import Icon from "../constants/Icon";
import("./styles/navBar.scss");

export default function NavBar({ backgroundColor = COLORS.white_01 }) {
  const [isHorizontal, setIsHorizontal] = useState(window.innerWidth > window.innerHeight);
  const { authState } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsHorizontal(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav className={isHorizontal ? "horizontal" : ""} id="NavBar" style={{ backgroundColor }}>
      <button className="optionContainer" onClick={() => handleNavigation("/")}>
        <Icon name="fam" size={24} color={COLORS.black_01} />
        <h3>WEBFAM</h3>
      </button>
      {isHorizontal ? <div id="menuOptions">
          <button onClick={() => handleNavigation("/athletes")} className={location.pathname.includes('athletes') ? 'active' : ''}>Atletas</button>
          <button onClick={() => handleNavigation("/results")} className={location.pathname.includes('results') ? 'active' : ''}>Resultados</button>
          <button onClick={() => handleNavigation("/meets")} className={location.pathname.includes('meets') || location.pathname.includes('meet/') ? 'active' : ''}>Competencias</button>
          <button onClick={() => handleNavigation("/ranking")} className={location.pathname.includes('ranking') ? 'active' : ''}>Ranking</button>
          {authState.authenticated ? <button className="optionContainer" onClick={() => handleNavigation("/athlete")}>
            <Icon name="user" size={24} color={COLORS.black_01} />
            <h3>{authState.user.name}</h3>
          </button> : <button className="optionContainer" onClick={() => handleNavigation("/login")}>
            <Icon name="user" size={24} color={COLORS.black_01} />
            <h3>Iniciar Sesion</h3>
          </button>}
        </div>
      : <div id="menuContainer">
        <Sidebar />
      </div>}
    </nav>
  );
}