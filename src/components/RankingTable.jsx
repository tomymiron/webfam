import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAuthClub } from "../contexts/AuthContextClub";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../constants/theme";
import { resultGetter, formatWeight } from "../constants/resultGetter";
import "./styles/rankingTable.scss";

// Utilidad para medir el ancho del texto
const measureTextWidth = (() => {
  let canvas = null;
  return (text, fontSize = 16, fontFamily = "Exo, Arial, sans-serif") => {
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    const context = canvas.getContext("2d");
    context.font = `${fontSize}px ${fontFamily}`;
    return context.measureText(text).width;
  };
})();

// Formateadores de datos (posición siempre 3 dígitos con cero a la izquierda)
const formatRankingNumber = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = typeof value === 'number' ? value : parseInt(value, 10);
  if (Number.isNaN(num)) return String(value);
  return String(num).padStart(3, '0');
};

const formatMark = (value, unit) => {
  if (value === undefined || value === null || value === '') return '-';
  
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return value;
  
  return resultGetter(numericValue, unit);
};

const formatWind = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return '-';
  return numericValue.toFixed(2).replace(/\.?0+$/, '');
};


const formatBorn = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') {
    const yearMatch = value.match(/^(\d{4})/);
    return yearMatch ? yearMatch[1] : value;
  }
  if (value instanceof Date) {
    return value.getFullYear().toString();
  }
  const yearMatch = String(value).match(/^(\d{4})/);
  return yearMatch ? yearMatch[1] : String(value);
};

const getTextAlign = (align) => {
  return align === "right" ? "right" : align === "center" ? "center" : "left";
};

const getJustifyAlign = (align) => {
  return align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
};

const RankingTable = ({ data, toShowColumns, main, highlightedColor = COLORS.purple_01 }) => {
  const { authState } = useAuth();
  const { authState: clubAuthState } = useAuthClub();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0
  });
  const [containerWidth, setContainerWidth] = useState(0);

  // Manejo responsive del tamaño de ventana
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Obtener ancho del contenedor
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Observer para cambios en el tamaño del contenedor (con fallback)
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    } else {
      // Fallback: usar MutationObserver o polling para navegadores antiguos
      const checkWidth = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
      const intervalId = setInterval(checkWidth, 100);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(intervalId);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const isMobile = windowSize.width > 0 && windowSize.width <= 768;
  const isTablet = windowSize.width > 768 && windowSize.width <= 1024;

  // Función para navegar al perfil del atleta
  const navigateToAthlete = useCallback((athleteId) => {
    if (athleteId) {
      navigate(`/athlete/${athleteId}`);
    }
  }, [navigate]);

  // Validación de datos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="ranking-table-container" ref={containerRef}>
        <div className="table">
          <div className="header">
            <div className="tr">
              <div className="th">Sin datos</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preparar columnas (ocultar desktopOnly en viewport <= 768px)
  const columns = useMemo(() => {
    if (!Array.isArray(toShowColumns) || toShowColumns.length === 0) {
      return Object.keys(data[0]).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        align: "left"
      }));
    }
    return toShowColumns
      .filter(colObj => Object.prototype.hasOwnProperty.call(data[0], colObj.key))
      .filter(colObj => !(colObj.desktopOnly && isMobile))
      .map(colObj => ({ ...colObj, align: colObj.align || "left" }));
  }, [data, toShowColumns, isMobile]);

  // Calcular anchos mínimos de columnas (para columnas fijas)
  const minColumnWidths = useMemo(() => {
    if (windowSize.width === 0) return columns.map(() => 0);

    const fontSize = isMobile ? 13 : 15;
    const padding = isMobile ? 16 : 20; // Padding reducido para optimizar espacio
    const fontFamily = "Exo, Arial, sans-serif";

    return columns.map((colObj) => {
      const header = colObj.label || colObj.key.charAt(0).toUpperCase() + colObj.key.slice(1);
      
      // Obtener todos los valores de la columna
      const cellValues = data.map(row => {
        const value = row[colObj.key];
        if (value === null || value === undefined) return '';
        
        // Formatear según el tipo de columna
        if (colObj.key === 'best_mark') return formatMark(value, row.unit);
        if (colObj.key === 'wind') return formatWind(value);
        if (colObj.key === 'weight') return formatWeight(value, row.weight_label) || '-';
        if (colObj.key === 'athlete_born') return formatBorn(value);
        if (colObj.key === 'position') return formatRankingNumber(value);
        // El badge "NO FAM" ocupa lugar dentro de la celda del nombre: hay que
        // reservarlo acá o la columna queda corta y el badge se solapa.
        if (colObj.key === 'athlete_name') return String(value) + (row.is_fam === false ? '  NO FAM ' : '');
        return String(value);
      });

      // Encontrar el contenido más ancho
      const allTexts = [header, ...cellValues];
      const maxWidth = allTexts.reduce((max, text) => {
        const width = measureTextWidth(String(text), fontSize, fontFamily);
        return width > max ? width : max;
      }, 0);

      const calculatedWidth = Math.ceil(maxWidth) + padding;

      // Ajustes específicos optimizados para usar menos espacio
      if (isMobile) {
        // Columnas que pueden expandirse sin límite en mobile (athlete_name, date, place)
        const expandableColumns = ['athlete_name', 'date', 'place', 'club_alias'];
        if (expandableColumns.includes(colObj.key)) {
          // No limitar el ancho, usar el calculado completo
          return Math.max(calculatedWidth, expandableColumns.indexOf(colObj.key) === 0 ? 100 : 70);
        }

        // Columnas con límites en mobile (compactas)
        const mobileLimits = {
          position: { min: 36, max: 44 },
          best_mark: { min: 50, max: 60 },
          athlete_born: { min: 40, max: 48 },
          wind: { min: 45, max: 58 },
          weight: { min: 40, max: 50 },
        };

        const limit = mobileLimits[colObj.key];
        if (limit) {
          return Math.max(limit.min, Math.min(calculatedWidth, limit.max));
        }
      } else {
        // Desktop: anchos mínimos optimizados
        const desktopLimits = {
          position: { min: 50, max: 60 },
          best_mark: { min: 70, max: 85 },
          athlete_born: { min: 55, max: 65 },
          wind: { min: 60, max: 75 },
          weight: { min: 55, max: 65 },
        };

        const limit = desktopLimits[colObj.key];
        if (limit) {
          return Math.max(limit.min, Math.min(calculatedWidth, limit.max));
        }

        // Para athlete_name en desktop, usar mínimo pero permitir crecimiento
        if (colObj.key === 'athlete_name') {
          return Math.max(calculatedWidth, 200);
        }

        // Usar minWidth si está especificado
        if (colObj.minWidth) {
          return Math.max(calculatedWidth, colObj.minWidth);
        }
      }

      return calculatedWidth;
    });
  }, [data, columns, windowSize.width, isMobile]);

  // Calcular distribución de anchos: fijas vs flexibles
  const columnWidths = useMemo(() => {
    if (windowSize.width === 0) {
      return columns.map((colObj, idx) => {
        if (colObj.fixed) return minColumnWidths[idx];
        return minColumnWidths[idx]; // En mobile, usar ancho calculado completo
      });
    }

    // En mobile, usar anchos calculados completos (sin limitar por contenedor)
    if (isMobile) {
      return columns.map((colObj, idx) => minColumnWidths[idx]);
    }

    // Desktop: distribución inteligente con flexbox
    if (containerWidth === 0) {
      return columns.map((colObj, idx) => {
        if (colObj.fixed) return minColumnWidths[idx];
        return 'auto';
      });
    }

    // Identificar columnas fijas y flexibles
    const fixedColumns = columns.map((col, idx) => ({ col, idx, width: minColumnWidths[idx] }));
    const flexibleColumns = columns.map((col, idx) => ({ col, idx })).filter((_, idx) => !columns[idx].fixed);

    // Calcular ancho total de columnas fijas
    const fixedWidth = fixedColumns.reduce((sum, { width }) => sum + width, 0);
    
    // Ancho disponible para columnas flexibles (con margen de seguridad)
    const availableWidth = containerWidth - fixedWidth - 48;
    const flexibleCount = flexibleColumns.length;

    if (flexibleCount === 0) {
      return columns.map((colObj, idx) => minColumnWidths[idx]);
    }

    // Distribuir espacio entre columnas flexibles
    const baseFlexWidth = Math.floor(availableWidth / flexibleCount);
    
    // Para athlete_name, dar más espacio si es flexible
    const athleteNameIdx = columns.findIndex(col => col.key === 'athlete_name');
    const isAthleteNameFlexible = athleteNameIdx !== -1 && !columns[athleteNameIdx].fixed;
    
    return columns.map((colObj, idx) => {
      if (colObj.fixed) {
        return minColumnWidths[idx];
      }
      
      // Si es athlete_name y es flexible, dar más espacio
      if (colObj.key === 'athlete_name' && isAthleteNameFlexible) {
        const extraSpace = Math.floor(availableWidth * 0.15); // 15% extra para nombres
        return baseFlexWidth + extraSpace;
      }
      
      return baseFlexWidth;
    });
  }, [columns, minColumnWidths, containerWidth, windowSize.width, isMobile]);

  // Formatear valor de celda
  const formatCellValue = useCallback((colObj, row) => {
    const value = row[colObj.key];
    
    if (colObj.key === 'best_mark') {
      return formatMark(value, row.unit);
    }
    if (colObj.key === 'wind') {
      return formatWind(value);
    }
    if (colObj.key === 'weight') {
      return formatWeight(value, row.weight_label) || '-';
    }
    if (colObj.key === 'athlete_born') {
      return formatBorn(value);
    }
    if (colObj.key === 'position') {
      return formatRankingNumber(value);
    }
    
    return value === null || value === undefined ? '-' : String(value);
  }, []);

  // Ya no truncamos nombres en mobile - la tabla se expande con scroll

  return (
    <div className="ranking-table-container" ref={containerRef}>
      <div className="table">
        {/* Header */}
        <div className="header">
          <div className="tr">
            {columns.map((colObj, idx) => {
              const width = typeof columnWidths[idx] === 'number' 
                ? `${columnWidths[idx]}px` 
                : columnWidths[idx];
              
              return (
                <div
                  key={colObj.key}
                  className={`th ${colObj.fixed ? 'fixed' : 'flexible'}`}
                  style={{
                    width: typeof width === 'number' ? `${width}px` : width,
                    minWidth: typeof width === 'number' ? `${width}px` : (colObj.fixed ? `${minColumnWidths[idx]}px` : '0'),
                    maxWidth: typeof width === 'number' ? `${width}px` : (colObj.fixed ? `${minColumnWidths[idx]}px` : 'none'),
                    flex: colObj.fixed ? '0 0 auto' : (isMobile ? '0 0 auto' : '1 1 0'),
                    textAlign: getTextAlign(colObj.align),
                    justifyContent: getJustifyAlign(colObj.align),
                  }}
                >
                  <p>
                    {colObj.bold ? (
                      <b>{colObj.label || colObj.key.charAt(0).toUpperCase() + colObj.key.slice(1)}</b>
                    ) : (
                      colObj.label || colObj.key.charAt(0).toUpperCase() + colObj.key.slice(1)
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="body">
          {data.map((row, index) => {
            const isCurrentUser = authState.authenticated && main && row[main] === authState.user.id;
            const isClubAthlete = clubAuthState.authenticated && row.club_alias === clubAuthState.club?.alias;

            return (
              <div
                key={index}
                className="tr"
                style={{
                  backgroundColor: isCurrentUser ? highlightedColor : (isClubAthlete ? COLORS.purple_01 : undefined)
                }}
              >
                {columns.map((colObj, idx) => {
                  const displayValue = formatCellValue(colObj, row);

                  const width = typeof columnWidths[idx] === 'number' 
                    ? `${columnWidths[idx]}px` 
                    : columnWidths[idx];

                  // Verificar si la celda es clickeable (athlete_name o best_mark)
                  const isClickable = colObj.key === 'athlete_name' || colObj.key === 'best_mark';

                  return (
                    <div
                      key={colObj.key}
                      className={`td ${colObj.fixed ? 'fixed' : 'flexible'} ${colObj.key === 'athlete_name' ? 'athlete-name' : ''} ${isClickable ? 'clickable' : ''}`}
                      style={{
                        width: typeof width === 'number' ? `${width}px` : width,
                        minWidth: typeof width === 'number' ? `${width}px` : (colObj.fixed ? `${minColumnWidths[idx]}px` : '0'),
                        maxWidth: typeof width === 'number' ? `${width}px` : (colObj.fixed ? `${minColumnWidths[idx]}px` : 'none'),
                        flex: colObj.fixed ? '0 0 auto' : (isMobile ? '0 0 auto' : '1 1 0'),
                        textAlign: getTextAlign(colObj.align),
                        justifyContent: getJustifyAlign(colObj.align),
                        cursor: isClickable ? 'pointer' : 'default',
                      }}
                      onClick={isClickable ? () => navigateToAthlete(row[main]) : undefined}
                      role={isClickable ? 'button' : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      onKeyDown={isClickable ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigateToAthlete(row[main]);
                        }
                      } : undefined}
                    >
                      <p>
                        {colObj.bold ? <b>{displayValue}</b> : displayValue}
                        {colObj.key === 'athlete_name' && row.is_fam === false && (
                          <span className="badge-no-fam" title="El atleta ya no pertenece a FAM. La marca cuenta por el club que tenía cuando la hizo.">
                            NO FAM
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RankingTable;
