import "material-react-toastify/dist/ReactToastify.css";
import MeetItem from "../components/meets/MeetItem";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import ClubNavBar from "../components/ClubNavBar";
import Transition from "../Transition";
import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function ClubMeets() {
  useEffect(() => {import("./styles/clubMeets.scss")}, []);
  const navigate = useNavigate();

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
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  const observerTarget = useRef(null);

  const pastMeets = pastMeetsData?.pages.flatMap((page) => page.data) || [];

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

  const handleMeetClick = (meetId) => {
    navigate(`/club/meet/${meetId}`);
  };

  return (
    <div id="ClubMeets">
      <ClubNavBar />

      <main>
        <section>
          <div id="meetsHeader">
            <h2>PROXIMAS<br />COMPETENCIAS</h2>
            <div className="lineSeparator" />
            <p>Inscribe a tus atletas de manera simple.</p>
          </div>

          <div id="meetsContainer">
            {isLoadingNext ? (
              <p>Cargando...</p>
            ) : nextMeets?.length > 0 ? (
              nextMeets.map((meet) => (
                <div key={meet.id} onClick={() => handleMeetClick(meet.id)}>
                  <MeetItem meet={meet} />
                </div>
              ))
            ) : (
              <p>No hay competencias próximas</p>
            )}
          </div>
        </section>

        <section>
          <div id="meetsHeader">
            <h2>COMPETENCIAS<br />PASADAS</h2>
            <div className="lineSeparator" />
            <p>Revisa competencias anteriores.</p>
          </div>

          <div id="meetsContainer">
            {isLoadingPast ? (
              <p>Cargando...</p>
            ) : pastMeets.length > 0 ? (
              <>
                {pastMeets.map((meet) => (
                  <div key={meet.id} onClick={() => handleMeetClick(meet.id)}>
                    <MeetItem meet={meet} />
                  </div>
                ))}
                <div ref={observerTarget} style={{ width: "100%", height: "20px" }}>
                  {isFetchingNextPage && <p>Cargando más...</p>}
                </div>
              </>
            ) : (
              <p>No hay competencias pasadas</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Transition(ClubMeets);

