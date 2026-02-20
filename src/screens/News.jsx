import "material-react-toastify/dist/ReactToastify.css";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { timeSince } from "../constants/timeGetter";
import { COLORS } from "../constants/theme";
import Icon from "../constants/Icon";

function News() {
  useEffect(() => { import("./styles/news.scss") }, []);
  const navigate = useNavigate();

  const { data: rawNews, isLoading, isError, error } = useQuery({
    queryKey: ["news"],
    queryFn: () =>
      makeRequest.get("/news/latest", { params: { limit: 100 } }).then((res) => res.data),
  });

  const news = Array.isArray(rawNews) ? rawNews : (rawNews?.news ?? []);

  const getImageUrl = (image) => {
    if (!image) return null;
    return `${import.meta.env.VITE_API_URL}/image/news/${image}`;
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    return text.length <= maxLength ? text : text.substring(0, maxLength) + "...";
  };

  const handleNewsClick = (item) => {
    navigate(`/news/${item.id}`, { state: { news: item } });
  };

  return (
    <div id="News">
      <NavBar />
      <main>
        <section>
          <div id="newsHeader">
            <h2>NOTICIAS FAM</h2>
            <div className="lineSeparator" />
            <p>Mantente informado sobre las últimas novedades.</p>
          </div>

          <div id="newsContainer">
            {isLoading ? (
              <p className="loadingMessage">Cargando noticias...</p>
            ) : isError ? (
              <p className="emptyMessage">
                No se pudieron cargar las noticias. {error?.message || "Intenta de nuevo más tarde."}
              </p>
            ) : news.length > 0 ? (
              news.map((item) => (
                <div
                  key={item.id}
                  className="newsItem"
                  onClick={() => handleNewsClick(item)}
                >
                  {getImageUrl(item.image) && (
                    <div className="newsImage">
                      <img src={getImageUrl(item.image)} alt={item.title} />
                    </div>
                  )}
                  <div className="newsContent">
                    <h3 className="newsTitle">{item.title}</h3>
                    {item.subtitle && (
                      <p className="newsSubtitle">{item.subtitle}</p>
                    )}
                    <p className="newsDescription">{truncateText(item.description)}</p>
                    <div className="newsFooter">
                      <p className="newsDate">hace {timeSince(item.created_at)}</p>
                      <div className="newsArrow">
                        <Icon name="right-arrow" size={20} color={COLORS.black_01} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="emptyMessage">No hay noticias disponibles</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Transition(News);
