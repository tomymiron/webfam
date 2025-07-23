import { motion } from "framer-motion"

const variants = {
    open: {
        transition: {
            staggerChildren: 0.1
        },
    },
    closed: {
        transition: {
            staggeredChildren: 0.05,
            staggeredDirection: -1
        }
    }
};
const itemVariants = {
    open: {
        y: 0,
        opacity: 1,
    },
    closed: {
        y: 50,
        opacity: 0,
    }
}
export default function Links() {

    const items = [
      { label: "Atletas", href: "athletes" },
      { label: "Resultados", href: "results" },
      { label: "Competencias", href: "competitions" },
      { label: "Ranking", href: "ranking" },
      { label: "Iniciar Sesion", href: "login" },
    ];
  
    return (
      <motion.div className="links" variants={variants}>
        {items.map((item, index) => (
          <motion.a
            key={index}
            href={item.href}
            variants={itemVariants}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={item.action ? (e) => { e.preventDefault(); item.action();} : undefined}
          >
            {item.label}
          </motion.a>
        ))}
      </motion.div>
    );
  }