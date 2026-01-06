import { useAuth } from "../../contexts/AuthContext";
import { useAuthClub } from "../../contexts/AuthContextClub";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

const variants = {
  open: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  closed: {
    transition: {
      staggeredChildren: 0.05,
      staggeredDirection: -1,
    },
  },
};

const itemVariants = {
  open: {
    y: 0,
    opacity: 1,
  },
  closed: {
    y: 0,
    opacity: 0,
  },
};

export default function Links() {
  const { authState } = useAuth();
  const { authState: clubAuthState } = useAuthClub();
  const navigate = useNavigate();
  const location = useLocation();

  // Determinar automáticamente el tipo de usuario
  const userType = (() => {
    const isClubRoute = location.pathname.startsWith("/club");
    if (clubAuthState?.authenticated || isClubRoute) {
      return "club";
    }
    if (authState?.authenticated) {
      return "athlete";
    }
    return "guest";
  })();

  const athleteItems = [
    { label: "Atletas", path: "/athletes" },
    { label: "Clubes", path: "/clubs" },
    { label: "Resultados", path: "/results" },
    { label: "Competencias", path: "/meets" },
    { label: "Noticias", path: "/news" },
    { label: "Ranking", path: "/ranking" },
    ...(authState?.authenticated ? [
      { label: "Mi Perfil", path: "/athlete" }
    ] : [
      { label: "Iniciar Sesion", path: "/login" }
    ]),
  ];

  const clubItems = [
    { label: "Inicio", path: "/" },
    { label: "Atletas", path: "/club/athletes" },
    { label: "Competencias", path: "/club/meets" },
    { label: "Solicitudes", path: "/club/requests" },
    { label: "Aranceles", path: "/club/prices" },
    { label: "Ranking", path: "/ranking" },
    ...(clubAuthState?.authenticated ? [
      { label: "Mi Club", path: "/club" }
    ] : [
      { label: "Iniciar Sesion", path: "/login" }
    ]),
  ];

  const items = userType === "club" ? clubItems : athleteItems;

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <motion.div className="links" variants={variants}>
      {items.map((item, index) => (
        <motion.button
          key={index}
          onClick={() => handleNavigation(item.path)}
          variants={itemVariants}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.1 }}
          className="nav-link"
        >
          {item.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
