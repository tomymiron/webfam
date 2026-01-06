import "material-react-toastify/dist/ReactToastify.css";
import { useAuthClub } from "../contexts/AuthContextClub";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import { useEffect } from "react";
import Transition from "../Transition";

function ClubPrices() {
  useEffect(() => {import("./styles/clubPrices.scss")}, []);
  
  const { authState } = useAuthClub();

  const { data: prices, isLoading } = useQuery({
    queryFn: () => makeRequest.get("/clubs/prices").then((res) => res.data),
    queryKey: ["clubPrices"],
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <div id="ClubPrices">
      <NavBar />

      <main>
        <section>
          <div id="header">
            <h2>ARANCELES</h2>
            <div className="lineSeparator"/>
            <p>Consulta los precios de inscripción por categoría.</p>
          </div>

          <div id="pricesContainer">
            {isLoading ? (
              <p className="loadingMessage">Cargando...</p>
            ) : prices && prices.length > 0 ? (
              <div id="pricesTable">
                <div className="tableHeader">
                  <div className="headerCell">ID</div>
                  <div className="headerCell">Nombre</div>
                  <div className="headerCell">Precio</div>
                </div>
                {prices.map((price) => (
                  <div key={price.id} className="tableRow">
                    <div className="tableCell">{price.id}</div>
                    <div className="tableCell">
                      <span>{price.name}</span>
                    </div>
                    <div className="tableCell">
                      <span className="priceValue">{formatPrice(price.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="emptyMessage">No hay aranceles disponibles</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Transition(ClubPrices);

