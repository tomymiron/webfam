import ToggleButton from "./ToggleButton";
import { motion } from "framer-motion";
import { useState } from "react";
import Links from "./Links";
import "./sidebar.scss"

const variants = {
  open: {
    clipPath: "circle(1800px at 100% 50px)",
    transition: {
      type: "spring",
      stiffness: 20,
    },
  },
  closed: {
    clipPath: "circle(20px at calc(100% - 38px) 38px)",
    transition: {
      delay: 0.5,
      type: "sptring",
      stiffness: 400,
      damping: 40,
    },
  },
};

export default function Sidebar({pageLoad = true}) {
  const [open, setOpen] = useState(false);
  
  return (
    <motion.div className={`sidebar ${open ? 'sidebar-open' : ''}`} animate={open ? "open" : "closed"} initial={false}>
      {pageLoad && <motion.div className="background" variants={variants}>
        <Links />
      </motion.div>}
      <ToggleButton setOpen={setOpen}/>
    </motion.div>
  );
}