import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAuthClub } from "../contexts/AuthContextClub";
import { useEffect, useState, useMemo } from "react";
import { COLORS } from "../constants/theme";
import Sidebar from "./sidebar/Sidebar";
import Icon from "../constants/Icon";
import logo from "../assets/logo.png";
import("./styles/navBar.scss");

export default function NavBar({ backgroundColor = COLORS.white_01 }) {
  const [isHorizontal, setIsHorizontal] = useState(window.innerWidth > window.innerHeight);
  const { authState } = useAuth();
  const { authState: clubAuthState } = useAuthClub();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsHorizontal(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determinar el tipo de usuario y si estamos en una ruta de club
  const userType = useMemo(() => {
    // No considerar /clubs o /club-detail como ruta de club (son públicas)
    const isClubRoute = location.pathname.startsWith("/club/") && !location.pathname.startsWith("/clubs") && !location.pathname.startsWith("/club-detail");
    if (clubAuthState?.authenticated || isClubRoute) {
      return "club";
    }
    if (authState?.authenticated) {
      return "athlete";
    }
    return "guest";
  }, [authState?.authenticated, clubAuthState?.authenticated, location.pathname]);

  // Links públicos (para todos)
  const publicLinks = [
    { path: "/athletes", label: "Atletas", match: (path) => path.includes('/athletes') && !path.startsWith('/club') },
    { path: "/clubs", label: "Clubes", match: (path) => path.includes('/clubs') || path.includes('/club-detail/') },
    { path: "/results", label: "Resultados", match: (path) => path.includes('/results') },
    { path: "/meets", label: "Competencias", match: (path) => (path.includes('/meets') || path.includes('/meet/')) && !path.startsWith('/club') },
    { path: "/news", label: "Noticias", match: (path) => path.includes('/news') },
    { path: "/ranking", label: "Ranking", match: (path) => path.includes('/ranking') },
  ];

  // Links de club
  const clubLinks = [
    { path: "/club/athletes", label: "Atletas", match: (path) => path.includes('/club/athletes') },
    { path: "/club/meets", label: "Competencias", match: (path) => path.includes('/club/meets') || path.includes('/club/meet/') },
    { path: "/results", label: "Resultados", match: (path) => path.includes('/results') },
    { path: "/club/requests", label: "Solicitudes", match: (path) => path.includes('/club/requests') },
    { path: "/club/prices", label: "Aranceles", match: (path) => path.includes('/club/prices') },
    { path: "/ranking", label: "Ranking", match: (path) => path.includes('/ranking') },
  ];

  // Determinar qué links mostrar
  const menuLinks = userType === "club" ? clubLinks : publicLinks;

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Determinar el botón de usuario final
  const getUserButton = () => {
    if (userType === "club") {
      return (
        <button className="optionContainer" onClick={() => handleNavigation("/club")}>
          <Icon name="users-group" size={24} color={COLORS.black_01} />
          <h3>{clubAuthState?.club?.alias || "Club"}</h3>
        </button>
      );
    }
    if (userType === "athlete") {
      return (
        <button className="optionContainer" onClick={() => handleNavigation("/athlete")}>
          <Icon name="user" size={24} color={COLORS.black_01} />
          <h3>{authState?.user?.name || "Atleta"}</h3>
        </button>
      );
    }
    return (
      <button className="optionContainer" onClick={() => handleNavigation("/login")}>
        <Icon name="user" size={24} color={COLORS.black_01} />
        <h3>Iniciar Sesion</h3>
      </button>
    );
  };

  return (
    <nav className={isHorizontal ? "horizontal" : ""} id="NavBar" style={{ backgroundColor }}>
      <button className="optionContainer" onClick={() => handleNavigation("/")}>
        <img src={logo} alt="WEBFAM" style={{ width: 24, height: 24 }} />
        <h3>WEBFAM</h3>
      </button>
      {isHorizontal ? (
        <div id="menuOptions">
          {menuLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNavigation(link.path)}
              className={link.match(location.pathname) ? 'active' : ''}
            >
              {link.label}
            </button>
          ))}
          {getUserButton()}
        </div>
      ) : (
        <div id="menuContainer">
          <Sidebar />
        </div>
      )}
    </nav>
  );
}