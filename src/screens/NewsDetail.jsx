import "material-react-toastify/dist/ReactToastify.css";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { timeSince, dateOnlyFormatter } from "../constants/timeGetter";
import { COLORS } from "../constants/theme";
import Icon from "../constants/Icon";

function NewsDetail() {
  useEffect(() => {import("./styles/newsDetail.scss")}, []);
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: news, isLoading, isError } = useQuery({
    queryFn: () => makeRequest.get(`/news/${id}`).then((res) => res.data),
    queryKey: ["news", id],
    enabled: !!id,
  });

  const getImageUrl = (image) => {
    if (!image) return null;
    const baseUrl = import.meta.env.VITE_API_URL;
    return `${baseUrl}/image/news/${image}`;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return dateOnlyFormatter(date);
  };

  if (isLoading) {
    return (
      <div id="NewsDetail">
        <NavBar />
        <main>
          <p className="loadingMessage">Cargando noticia...</p>
        </main>
      </div>
    );
  }

  if (isError || !news) {
    return (
      <div id="NewsDetail">
        <NavBar />
        <main>
          <p className="errorMessage">Noticia no encontrada</p>
        </main>
      </div>
    );
  }

  return (
    <div id="NewsDetail">
      <NavBar />

      <main>
        <section>
          <button className="backButton" onClick={() => navigate("/news")}>
            <Icon name="left-arrow" size={20} color={COLORS.black_01} />
            Volver a Noticias
          </button>

          <article className="newsArticle">
            <div className="newsHeader">
              <h1 className="newsTitle">{news.title}</h1>
              {news.subtitle && (
                <p className="newsSubtitle">{news.subtitle}</p>
              )}
              <div className="newsMeta">
                <p className="newsDate">{formatDate(news.created_at)}</p>
                <p className="newsTimeAgo">hace {timeSince(news.created_at)}</p>
              </div>
            </div>

            {getImageUrl(news.image) && (
              <div className="newsImageContainer">
                <img src={getImageUrl(news.image)} alt={news.title} />
              </div>
            )}

            <div className="newsBody">
              <div className="newsDescription">
                {news.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default Transition(NewsDetail);

