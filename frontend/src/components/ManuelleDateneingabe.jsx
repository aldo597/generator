import React, { useState } from 'react';
import api from '../../api';
import erklaerungsbild from '../assets/Hier klicken.png';

function ManuelleDateneingabe({
  onGenerate,
  isGenerating
}) {
  const [expanded, setExpanded] = useState(false);
  const [file, setFile] = useState(null);
  const [votes, setVotes] = useState([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [expandedTitles, setExpandedTitles] = useState({});

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setFile(selectedFile);
    setVotes([]);
    setSelectedIdentifier(null);
    setExpandedTitles({});
    setFileLoaded(false);
    setError(null);
  };

  const handleUseFile = async () => {
    if (!file) {
      setError("Bitte zuerst eine XML-Datei auswählen.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/manuell/abstimmungen",
        formData
      );

      const data = response.data;

      setVotes(data);
      setFileLoaded(true);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "XML konnte nicht verarbeitet werden."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSelect = (identifier) => {
    setSelectedIdentifier(identifier);
  };

  const toggleExpand = (id) => {
    setExpandedTitles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  return (
    <div className="manual-section">

      {/* Überschrift */}
      <button
        className="manual-toggle"
        onClick={() => setExpanded(prev => !prev)}
      >
        <span>
          Manuelle Dateneingabe
        </span>

        <span className="manual-arrow">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {expanded && (
        <div className="manual-content">

          <p>
            Falls die Abstimmungsergebnisse noch nicht über die
            Europäische-Parlament-API verfügbar sind oder ein anderes Problem mit
            der automatischen Generierung auftritt, können die Ergebnisse auch direkt
            aus der offiziellen XML-Datei für den jeweiligen Plenumstag ausgelesen werden.
            Dazu muss die entsprechende XML-Datei (siehe Bild) einmal manuell auf der
            EP-Webseite heruntergeladen und anschließend hier hochgeladen werden, um die
            Abstimmungen einzulesen. Danach kann das Bild wie gewohnt generiert werden.
          </p>

          <p>
            Link zur Webseite:{" "}
            <a
              href="https://www.europarl.europa.eu/plenary/de/votes.html?tab=votes#banner_session_live"
              target="_blank"
              rel="noopener noreferrer"
            >
              Europäisches Parlament – Abstimmungen
            </a>
          </p>

          {/* Platzhalter für Erklärungsbild */}
          <div className="manual-image-placeholder">
            <img
              src={erklaerungsbild}
              alt="Erklärung zur manuellen Dateneingabe"
            />
          </div>

          <p>
            Lade dazu die entsprechende XML-Datei des
            Europäischen Parlaments hoch.
          </p>

          {/* Datei auswählen */}
          <input
            type="file"
            accept=".xml,text/xml,application/xml"
            onChange={handleFileChange}
          />

          {file && (
            <div className="selected-file">
              Ausgewählte Datei:
              <strong>{file.name}</strong>
            </div>
          )}

          <button
            className="manual-use-button"
            onClick={handleUseFile}
            disabled={!file || loading}
          >
            {loading
              ? "Datei wird eingelesen..."
              : "Datei verwenden"}
          </button>

          {error && (
            <div className="manual-error">
              {error}
            </div>
          )}

          {/* Abstimmungen */}
          {fileLoaded && votes.length > 0 && (
            <div className="manual-votes">

              <h3>
                Abstimmungen aus der XML-Datei
              </h3>

              {votes.map((vote, index) => {
                const voteKey = vote.dlv_id || `manual-${index}`;
                const isExpanded = expandedTitles[voteKey];

                return (
                  <div
                    className="punkt-container"
                    key={voteKey}
                  >
                    <h4
                      className="punkt-title"
                      onClick={() => toggleExpand(voteKey)}
                    >
                      <span className="vote-number">
                        {index + 1}.
                      </span>

                      <span
                        className={`toggle-arrow ${
                          isExpanded ? "expanded" : ""
                        }`}
                      >
                        {isExpanded ? "▼" : "▶"}
                      </span>

                      {vote.titel}
                    </h4>

                    {isExpanded && (
                      <div className="sub-votes">
                        {vote.unterabstimmungen?.length > 0 ? (
                          vote.unterabstimmungen.map(sub => (
                            <div
                              key={sub.identifier}
                              className={`sub-vote ${
                                selectedIdentifier === sub.identifier
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                handleVoteSelect(sub.identifier)
                              }
                            >
                              {sub.titel}
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
                );
              })}

              {selectedIdentifier && (
                <button
                  className="manual-generate-button"
                  onClick={() =>
                    onGenerate(
                      file,
                      selectedIdentifier
                    )
                  }
                  disabled={isGenerating}
                >
                  {isGenerating
                    ? "Rendering..."
                    : "Bild generieren"}
                </button>
              )}

            </div>
          )}

          {fileLoaded && votes.length === 0 && (
            <p>
              In der XML-Datei wurden keine Abstimmungen gefunden.
            </p>
          )}

        </div>
      )}

    </div>
  );
}

export default ManuelleDateneingabe;