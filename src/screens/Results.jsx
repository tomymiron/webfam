import { useEffect } from "react";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";

function Results() {
  useEffect(() => {import("./styles/results.scss")}, []);

  return (
    <div id="Results">
      <NavBar />

      <main>
        <section id="constructionSection">
          <div id="constructionContainer">
            <div id="constructionIcon">
              <Icon name="tag" size={92} color={COLORS.blue_01} />
            </div>

            <h1>Apartado en Construcción</h1>

            <p className="constructionMessage">
              Estamos trabajando en esta sección para traerte la mejor experiencia posible.
              Pronto podrás ver todos los resultados aquí.
            </p>

            <div id="constructionDetails">
              <div className="detailItem">
                <Icon name="clock" size={24} color={COLORS.black_01} />
                <span>Próximamente disponible</span>
              </div>

              <div className="detailItem">
                <Icon name="tag" size={24} color={COLORS.black_01} />
                <span>Resultados detallados</span>
              </div>

              <div className="detailItem">
                <Icon name="user-check" size={24} color={COLORS.black_01} />
                <span>Estadísticas completas</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Transition(Results);
