import { useAuth } from "../../contexts/AuthContext";
import { useAuthClub } from "../../contexts/AuthContextClub";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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

export default function Links({ userType = "athlete" }) {
  const { authState } = useAuth();
  const { authState: clubAuthState } = useAuthClub();
  const navigate = useNavigate();

  const athleteItems = [
    { label: "Atletas", path: "/athletes" },
    { label: "Resultados", path: "/results" },
    { label: "Competencias", path: "/meets" },
    { label: authState.authenticated ? "Mi Perfil" : "Iniciar Sesion", path: authState.authenticated ? "/athlete" : "/login" },
    { label: "Ranking", path: "/ranking" },
  ];

  const clubItems = [
    { label: "Inicio", path: "/club" },
    { label: "Atletas", path: "/club/athletes" },
    { label: "Solicitudes", path: "/club/requests" },
    { label: clubAuthState.authenticated ? "Mi Club" : "Iniciar Sesion", path: clubAuthState.authenticated ? "/club" : "/login" },
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
