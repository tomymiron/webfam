import "./screens/styles/transition.scss";
import { motion } from "framer-motion";

export default function Transition(InnerComponent) {
  return function WrappedComponent(props) {
    return (
        <>
          <InnerComponent {...props} />
          <motion.div
            exit={{ scaleY: 1 }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 0 }}
            className="transition-slide-in"
            transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            exit={{ scaleY: 0 }}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            className="transition-slide-out"
            transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
          />
        </>
    );
  };
}