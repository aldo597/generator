import React, { useState } from 'react';

function PunkteSelector({
  punkte,
  selectedPunkt,
  onPunktSelect
}) {
  const [expandedTitles, setExpandedTitles] = useState({});

  const toggleExpand = (dlvId) => {
    setExpandedTitles(prev => ({
      ...prev,
      [dlvId]: !prev[dlvId],
    }));
  };

  return (
    <div>
      <h2>3. Abstimmung auswählen:</h2>

      <div className="vote-options">
        {punkte.map((punkt, index) => (
          <div
            className="punkt-container"
            key={punkt.dlv_id}
          >
            {/* Hauptthema */}
            <h4
              className="punkt-title"
              onClick={() => toggleExpand(punkt.dlv_id)}
            >
              <span
                className={`vote-number ${
                  expandedTitles[punkt.dlv_id] ? 'expanded' : ''
                }`}
              >
                {index + 1}.
              </span>

              <span
                className={`toggle-arrow ${
                  expandedTitles[punkt.dlv_id] ? 'expanded' : ''
                }`}
              >
                {expandedTitles[punkt.dlv_id] ? '▼' : '▶'}
              </span>

              {punkt.titel}
            </h4>

            {/* Unterabstimmungen */}
            {expandedTitles[punkt.dlv_id] && (
              <div className="sub-votes">

                {punkt.unterabstimmungen?.length > 0 ? (
                  punkt.unterabstimmungen.map((unterabstimmung) => (
                    <div
                      key={unterabstimmung.identifier}
                      className={`sub-vote ${
                        selectedPunkt === unterabstimmung.identifier
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        onPunktSelect(unterabstimmung.identifier)
                      }
                    >
                      {unterabstimmung.titel}
                    </div>
                  ))
                ) : (
                  <div className="sub-vote-empty">
                    Keine Unterabstimmungen vorhanden.
                  </div>
                )}

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PunkteSelector;