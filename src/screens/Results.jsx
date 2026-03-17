import "material-react-toastify/dist/ReactToastify.css";
import { useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import Transition from "../Transition";
import MeetItem from "../components/meets/MeetItem";

function Results() {
  useEffect(() => { import("./styles/results.scss"); }, []);

  const containerRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setShowScrollTop(el.scrollTop > 300);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data: nextMeets, isLoading: isLoadingNext } = useQuery({
    queryFn: () => makeRequest.get("/meets").then((res) => res.data),
    queryKey: ["meets"],
  });

  const {
    data: pastMeetsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPast,
  } = useInfiniteQuery({
    queryKey: ["meets", "past"],
    queryFn: ({ pageParam = 1 }) =>
      makeRequest
        .get("/meets/past", { params: { page: pageParam, limit: 10 } })
        .then((res) => res.data),
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasMore ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const observerTarget = useRef(null);
  const pastMeets = pastMeetsData?.pages.flatMap((page) => page.data || []) || [];

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
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  const hasAnyMeets = (nextMeets?.length > 0) || pastMeets.length > 0;
  const isLoadingInitial = !hasAnyMeets && (isLoadingNext || isLoadingPast);

  return (
    <div id="Results" ref={containerRef}>
      <NavBar />

      <main>
        <section>
          <div id="resultsHeader">
            <h2>RESULTADOS</h2>
            <div className="lineSeparator" />
            <p>Elegí una competencia para ver sus resultados.</p>
          </div>

          <div id="resultsContainer">
            {isLoadingInitial ? (
              <p className="loadingMessage">Cargando torneos...</p>
            ) : !hasAnyMeets ? (
              <p className="emptyMessage">No hay torneos disponibles</p>
            ) : (
              <>
                {nextMeets?.length > 0 && (
                  <>
                    <h3 className="sectionLabel">Próximas competencias</h3>
                    <div className="meetsGrid">
                      {nextMeets.map((meet) => (
                        <MeetItem key={meet.id} meet={meet} linkToResults />
                      ))}
                    </div>
                  </>
                )}
                {pastMeets.length > 0 && (
                  <>
                    <h3 className="sectionLabel">Competencias realizadas</h3>
                    <div className="meetsGrid">
                      {pastMeets.map((meet) => (
                        <MeetItem key={meet.id} meet={meet} linkToResults />
                      ))}
                    </div>
                    <div ref={observerTarget} style={{ width: "100%", height: "20px" }}>
                      {isFetchingNextPage && (
                        <p className="loadingMore">Cargando más...</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {showScrollTop && (
        <button
          type="button"
          className="scrollToTopButton"
          onClick={scrollToTop}
          aria-label="Subir arriba"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default Transition(Results);
