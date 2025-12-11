import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { COLORS } from "../constants/theme";
import "./styles/rankingTable.scss";

const getTextWidth = (text, font = "500 16px Exo, Arial, sans-serif") => {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  return context.measureText(text).width;
};

const formatRankingNumber = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'number' && value < 10) return `0${value}`;
  if (typeof value === 'string' && !isNaN(value) && parseInt(value) < 10) return `0${value}`;
  return value;
};

const getTextAlign = (align) => {
  if (align === "right") return "right";
  if (align === "center") return "center";
  return "left";
};

const getJustifyAlign = (align) => {
  if (align === "right") return "flex-end";
  if (align === "center") return "center";
  return "flex-start";
};

const RankingTable = ({ data, toShowColumns, main, highlightedColor = COLORS.purple_01 }) => {
  const { authState } = useAuth();

  const isBrowser = typeof window !== "undefined";
  const [windowSize, setWindowSize] = useState({
    width: isBrowser ? window.innerWidth : 0,
    height: isBrowser ? window.innerHeight : 0
  });

  // Listener para cambios en el tamaño de la ventana
  useEffect(() => {
    if (!isBrowser) return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Force initial calculation on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    
    // Cleanup del listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isBrowser]);

  if (!data || data.length === 0) {
    return (
      <div className="ranking-table-container" style={{ fontFamily: "'Exo', Arial, sans-serif" }}>
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

  const columns = Array.isArray(toShowColumns) && toShowColumns.length > 0
    ? toShowColumns
      .filter(colObj => Object.prototype.hasOwnProperty.call(data[0], colObj.key))
      .map(colObj => ({ ...colObj, align: colObj.align || "left" }))
    : Object.keys(data[0]).map(key => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), align: "left" }));

  const minColumnWidths = useMemo(() => {
    if (!isBrowser) return columns.map(() => 0);

    // Use a fallback width if windowSize is not available yet
    const effectiveWidth = windowSize.width > 0 ? windowSize.width : 1200; // fallback to desktop width

    // Calculate the font size based on clamp(14px, 1vw + 0.5rem, 18px)
    // 1vw = window width / 100, 0.5rem = 8px (assuming root font-size 16px)
    const vw = effectiveWidth / 100;
    const fontSize = Math.max(14, Math.min(vw + 8, 18)); // clamp(14, vw+8, 18)
    const font = `400 ${fontSize + 4}px Exo, Arial, sans-serif`;

    return columns.map((colObj) => {
      const header = colObj.label || (colObj.key.charAt(0).toUpperCase() + colObj.key.slice(1));
      const cellValues = data.map((row) =>
        row[colObj.key] !== undefined && row[colObj.key] !== null ? String(row[colObj.key]) : ""
      );
      const maxContent = [header, ...cellValues].reduce((max, val) => {
        const width = getTextWidth(val, font);
        return width > max ? width : max;
      }, 0);
      // Padding: 24px (12px left + 12px right, as before)
      const calculatedWidth = Math.ceil(maxContent) + 24;
      // Use minWidth if specified, otherwise use calculated width
      return colObj.minWidth ? Math.max(calculatedWidth, colObj.minWidth) : calculatedWidth;
    });
  }, [data, columns, isBrowser, windowSize]);

  const getAvailableTableWidth = () => {
    if (!isBrowser) return undefined;
    
    // Use fallback width if windowSize is not available yet
    const effectiveWidth = windowSize.width > 0 ? windowSize.width : 1200;
    
    const mobileBreakpoint = 768;
    if (effectiveWidth <= mobileBreakpoint) return effectiveWidth - 24;
    const container = document.querySelector(".ranking-table-container .table");
    if (container) return container.clientWidth - 2;
    return Math.max(effectiveWidth - 32, 0);
  };

  const availableTableWidth = isBrowser ? getAvailableTableWidth() : undefined;

  // Calculate fixed columns total width
  const fixedColumnsWidth = minColumnWidths.reduce((sum, width, idx) => {
    return sum + (columns[idx].fixed ? width : 0);
  }, 0);

  // Calculate available space for auto columns
  const autoColumns = columns.filter(col => !col.fixed);
  const availableSpaceForAuto = availableTableWidth ? availableTableWidth - fixedColumnsWidth : 0;
  const autoColumnWidth = autoColumns.length > 0 ? Math.floor(availableSpaceForAuto / autoColumns.length) : 0;

  let finalColumnWidths;
  let tableWidth;
  
  if (isBrowser && availableTableWidth) {
    const effectiveWidth = windowSize.width > 0 ? windowSize.width : 1200;
    // For all viewports (including mobile), distribute remaining space to auto columns
    finalColumnWidths = columns.map((colObj, idx) => {
      if (colObj.fixed) {
        return minColumnWidths[idx];
      }
      return Math.max(minColumnWidths[idx], autoColumnWidth);
    });

    const totalWidth = finalColumnWidths.reduce((sum, width) => sum + width, 0);
    // Ensure table fills container width completely
    tableWidth = `${Math.max(totalWidth, availableTableWidth)}px`;
  } else {
    finalColumnWidths = columns.map((colObj, idx) => {
      return colObj.fixed ? minColumnWidths[idx] : 'auto';
    });
    tableWidth = undefined;
  }

  return (
    <div className="ranking-table-container" style={{ fontFamily: "'Exo', Arial, sans-serif" }}>
      <div className="table">
        <div
          className="header"
          style={isBrowser ? {
              width: tableWidth,
              minWidth: tableWidth,
              maxWidth: tableWidth,
            } : undefined}
        >
          <div className="tr" style={isBrowser ? { width: tableWidth } : undefined}>
            {columns.map((colObj, idx) => (
              <div
                className="th"
                key={colObj.key}
                style={{
                  flex: typeof finalColumnWidths[idx] === 'number' ? `0 0 ${finalColumnWidths[idx]}px` : '1 1 auto',
                  minWidth: typeof finalColumnWidths[idx] === 'number' ? `${finalColumnWidths[idx]}px` : 'auto',
                  maxWidth: typeof finalColumnWidths[idx] === 'number' ? `${finalColumnWidths[idx]}px` : 'auto',
                  width: typeof finalColumnWidths[idx] === 'number' ? `${finalColumnWidths[idx]}px` : 'auto',
                  textAlign: getTextAlign(colObj.align),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: getJustifyAlign(colObj.align),
                }}
              >
                <p>{colObj.bold ? <b>{colObj.label || (colObj.key.charAt(0).toUpperCase() + colObj.key.slice(1))}</b> : (colObj.label || (colObj.key.charAt(0).toUpperCase() + colObj.key.slice(1)))}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="body">
          {data.map((row, index) => {
            const isCurrentUser = authState.authenticated && main && row[main] === authState.user.id;
            return (
              <div 
                key={index} 
                className={`tr ${index < 3 ? `rank-${index + 1}` : ""}`} 
                style={isBrowser ? { 
                  width: tableWidth,
                  backgroundColor: isCurrentUser ? highlightedColor : undefined
                } : {
                  backgroundColor: isCurrentUser ? highlightedColor : undefined
                }}
              >
              {columns.map((colObj, idx) => (
                <div
                  className="td"
                  key={colObj.key}
                  style={{
                    minWidth: typeof finalColumnWidths[idx] === 'number' ? `${finalColumnWidths[idx]}px` : 'auto',
                    maxWidth: typeof finalColumnWidths[idx] === 'number' ? `${finalColumnWidths[idx]}px` : 'auto',
                    width: typeof finalColumnWidths[idx] === 'number' ? `${finalColumnWidths[idx]}px` : 'auto',
                    flex: typeof finalColumnWidths[idx] === 'number' ? `0 0 ${finalColumnWidths[idx]}px` : '1 1 auto',
                    textAlign: getTextAlign(colObj.align),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: getJustifyAlign(colObj.align),
                  }}
                >
                  <p>{colObj.bold ? <b>{formatRankingNumber(row[colObj.key])}</b> : formatRankingNumber(row[colObj.key])}</p>
                </div>
              ))}
              </div>
            );
          })}
        </div>
      </div>
  
    </div>
  );
};

export default RankingTable;