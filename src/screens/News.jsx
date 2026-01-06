import "material-react-toastify/dist/ReactToastify.css";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { timeSince } from "../constants/timeGetter";
import { COLORS } from "../constants/theme";
import Icon from "../constants/Icon";

function News() {
  useEffect(() => {import("./styles/news.scss")}, []);
  const navigate = useNavigate();

  const {
    data: newsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["news"],
    queryFn: ({ pageParam = 1 }) =>
      makeRequest
        .get("/news", { params: { page: pageParam, limit: 20 } })
        .then((res) => res.data),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const observerTarget = useRef(null);

  const news = newsData?.pages.flatMap((page) => page.news) || [];

  const handleObserver = useCallback(
    (entries) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  const getImageUrl = (image) => {
    if (!image) return null;
    const baseUrl = import.meta.env.VITE_API_URL;
    return `${baseUrl}/image/news/${image}`;
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
            ) : news.length > 0 ? (
              <>
                {news.map((item) => (
                  <div 
                    key={item.id} 
                    className="newsItem"
                    onClick={() => navigate(`/news/${item.id}`)}
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
                ))}
                <div ref={observerTarget} style={{ width: "100%", height: "20px", marginTop: "20px" }}>
                  {isFetchingNextPage && (
                    <p style={{ textAlign: "center", color: COLORS.black_01, opacity: 0.7 }}>
                      Cargando más noticias...
                    </p>
                  )}
                </div>
              </>
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

