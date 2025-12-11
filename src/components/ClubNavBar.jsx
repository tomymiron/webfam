import { useAuthClub } from "../contexts/AuthContextClub";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { COLORS } from "../constants/theme";
import Sidebar from "./sidebar/Sidebar";
import Icon from "../constants/Icon";
import("./styles/navBar.scss");

export default function ClubNavBar({ backgroundColor = COLORS.white_01 }) {
  const [isHorizontal, setIsHorizontal] = useState(window.innerWidth > window.innerHeight);
  const { authState } = useAuthClub();
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

  const clubLinks = [
    { path: "/club", label: "Inicio", exact: true },
    { path: "/club/athletes", label: "Atletas" },
    { path: "/club/meets", label: "Competencias" },
    { path: "/club/requests", label: "Solicitudes" },
  ];

  return (
    <nav className={isHorizontal ? "horizontal" : ""} id="NavBar" style={{ backgroundColor }}>
      <button className="optionContainer" onClick={() => handleNavigation("/club")}>
        <Icon name="fam" size={24} color={COLORS.black_01} />
        <h3>WEBFAM</h3>
      </button>
      {isHorizontal ? <div id="menuOptions">
          {clubLinks.map(link => (
            <button 
              key={link.path}
              onClick={() => handleNavigation(link.path)} 
              className={link.exact ? (location.pathname === link.path ? 'active' : '') : (location.pathname.includes(link.path) ? 'active' : '')}
            >
              {link.label}
            </button>
          ))}
          {authState?.authenticated && <button className="optionContainer">
            <Icon name="users-group" size={24} color={COLORS.black_01} />
            <h3>{authState.club?.alias || "Club"}</h3>
          </button>}
        </div>
      : <div id="menuContainer">
        <Sidebar userType="club" />
      </div>}
    </nav>
  );
}

