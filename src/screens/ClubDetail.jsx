import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../config/axios";
import NavBar from "../components/NavBar";
import { profileImageGetter, clubImageGetter } from "../constants/imageGetter";
import { categoryGetter } from "../constants/categoryGetter";
import Icon from "../constants/Icon";
import { COLORS } from "../constants/theme";
import Transition from "../Transition";

function ClubDetail() {
  useEffect(() => {import("./styles/clubDetail.scss")}, []);

  const { id } = useParams();
  const navigate = useNavigate();

  // Query para obtener datos del club
  const { data: clubData, isLoading, isError, refetch } = useQuery({
    queryKey: ['club-detail', id],
    queryFn: async () => {
      const response = await makeRequest.get(`/clubs/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleBack = () => {
    // Si hay historial para volver atrás (más de 1 página), ir atrás
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Si no hay historial, ir a la página de clubes
      navigate('/clubs');
    }
  };

  const handleAthleteClick = (athleteId) => {
    navigate(`/athlete/${athleteId}`);
  };

  const formatAge = (bornDate) => {
    if (!bornDate) return 'N/A';

    // Parsear fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = bornDate.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return `${age} años`;
  };

  // Determinar si un atleta está habilitado
  const isAthleteEnabled = (athlete) => {
    return athlete.cert_status === 2 && athlete.has_valid_payment === 1;
  };

  if (isLoading) {
    return (
      <div id="ClubDetail">
        <NavBar />
        <main>
          <div className="loadingContainer">
            <p>Cargando club...</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !clubData) {
    return (
      <div id="ClubDetail">
        <NavBar />
        <main>
          <div className="errorContainer">
            <Icon name="close" size={48} color={COLORS.red_01} />
            <h3>Error al cargar club</h3>
            <p>No se pudo encontrar la información del club solicitado.</p>
            <div className="errorActions">
              <button onClick={refetch}>Reintentar</button>
              <button onClick={handleBack}>Volver</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { club, athletes } = clubData;
  const enabledAthletes = athletes.filter(a => isAthleteEnabled(a));
  const disabledAthletes = athletes.filter(a => !isAthleteEnabled(a));

  return (
    <div id="ClubDetail">
      <NavBar />

      <main>
        {/* Botón de volver */}
        <section id="backSection">
          <button className="backButton" onClick={handleBack} aria-label="Volver">
            <Icon name="left-arrow" size={24} color={COLORS.white_02} />
          </button>
        </section>

        {/* Información del club */}
        <section id="clubInfoSection">
          <div id="clubProfile">
            <div id="clubImage">
              <img src={clubImageGetter(club.image)} alt={club.name} />
            </div>

            <div id="clubDetails">
              <h1>{club.name}</h1>
              <p className="clubAlias">{club.alias}</p>
              <div className="clubMeta">
                <div className="metaItem">
                  <Icon name="users-group" size={16} color={COLORS.white_02} />
                  <span>{athletes.length} atletas</span>
                </div>
              </div>
              {club.description && (
                <p className="clubDescription">{club.description}</p>
              )}
            </div>
          </div>
        </section>

        {/* Lista de atletas */}
        <section id="athletesSection">
          <h2>Atletas del Club</h2>

          {/* Atletas habilitados */}
          {enabledAthletes.length > 0 && (
            <div className="athletesGroup">
              <h3 className="groupTitle enabled">
                <Icon name="check" size={20} color={COLORS.green_01} />
                Habilitados ({enabledAthletes.length})
              </h3>
              <div className="athletesGrid">
                {enabledAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="athleteCard enabled"
                    onClick={() => handleAthleteClick(athlete.id)}
                  >
                    <div className="athleteImage">
                      <img
                        src={profileImageGetter(athlete.image)}
                        alt={athlete.name}
                      />
                      <div className="statusBadge enabled">
                        <Icon name="check" size={12} color={COLORS.white_01} />
                      </div>
                    </div>

                    <div className="athleteInfo">
                      <h4>{athlete.name}</h4>
                      <p className="athleteCategory">
                        {categoryGetter(athlete.born)}
                      </p>
                      <div className="athleteGender">
                        <Icon
                          name="user"
                          size={14}
                          color={COLORS.white_02}
                        />
                        <span>{athlete.gender === 1 ? 'Hombre' : 'Mujer'}</span>
                      </div>
                    </div>

                    <div className="athleteActions">
                      <Icon name="right-arrow" size={16} color={COLORS.white_02} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Atletas no habilitados */}
          {disabledAthletes.length > 0 && (
            <div className="athletesGroup">
              <h3 className="groupTitle disabled">
                <Icon name="close" size={20} color={COLORS.red_01} />
                No Habilitados ({disabledAthletes.length})
              </h3>
              <div className="athletesGrid">
                {disabledAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="athleteCard disabled"
                    onClick={() => handleAthleteClick(athlete.id)}
                  >
                    <div className="athleteImage">
                      <img
                        src={profileImageGetter(athlete.image)}
                        alt={athlete.name}
                      />
                      <div className="statusBadge disabled">
                        <Icon name="close" size={12} color={COLORS.white_01} />
                      </div>
                    </div>

                    <div className="athleteInfo">
                      <h4>{athlete.name}</h4>
                      <p className="athleteCategory">
                        {categoryGetter(athlete.born)}
                      </p>
                      <div className="athleteGender">
                        <Icon
                          name="user"
                          size={14}
                          color={COLORS.white_02}
                        />
                        <span>{athlete.gender === 1 ? 'Hombre' : 'Mujer'}</span>
                      </div>
                    </div>

                    <div className="athleteActions">
                      <Icon name="right-arrow" size={16} color={COLORS.white_02} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin atletas */}
          {athletes.length === 0 && (
            <div className="noAthletes">
              <Icon name="users-group" size={48} color={COLORS.white_02} />
              <h3>No hay atletas en este club</h3>
              <p>Este club aún no tiene atletas registrados</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Transition(ClubDetail);

