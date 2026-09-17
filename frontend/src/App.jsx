import React, { useEffect, useState, useRef } from 'react';import axios from 'axios';
import WochenSelector from './components/WochenSelector';
import TageSelector from './components/TageSelector';
import PunkteSelector from './components/PunkteSelector';
import TitelInput from './components/TitelInput';
import './App.css';
import logo from './logo_greens.png';
import api from '../api';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import ManuelleDateneingabe from './components/ManuelleDateneingabe';

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [format, setFormat] = useState('square');
  const [wochen, setWochen] = useState([]);
  const [tage, setTage] = useState([]);
  const [punkteByTag, setPunkteByTag] = useState({});
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedPunkt, setSelectedPunkt] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWochen, setIsLoadingWochen] = useState(false);
  const [isLoadingTage, setIsLoadingTage] = useState(false);
  const [isLoadingPunkte, setIsLoadingPunkte] = useState(false);
  const [titel, setTitel] = useState('');
  const [error, setError] = useState(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [imageSource, setImageSource] = useState(null);

  const [manualFile, setManualFile] = useState(null);
  const [manualIdentifier, setManualIdentifier] = useState(null);

  const imageSectionRef = useRef(null);

  // 🔐 Überwache Login-Zustand
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    // Wenn kein User → fertig
    if (!currentUser) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    // Wenn User existiert aber NICHT verifiziert → NICHT einloggen!
    if (!currentUser.emailVerified) {
      setUser(null);             // ⛔ verhindert Weiterleitung
      setLoadingUser(false);
      return;
    }

    // Nur verifizierten User akzeptieren
    setUser(currentUser);
    setLoadingUser(false);
  });

  return unsubscribe;
}, []);

const selectTag = (datum) => {
  setSelectedTag(datum);
  setSelectedPunkt(null);
  setImageUrl(null);
  setTitel('');
  setShowAdvancedSettings(false);
};

const handlePunktSelect = (identifier) => {
  setSelectedPunkt(identifier);
  setImageUrl(null);
  setTitel('');
  setShowAdvancedSettings(false);
};

const handleManualGenerate = async (
  file,
  identifier,
  customTitel = ''
) => {
  setIsLoading(true);
  setError(null);

  // Für spätere erneute Generierung speichern
  setManualFile(file);
  setManualIdentifier(identifier);

  const formData = new FormData();

  formData.append("identifier", identifier);
  formData.append("titel", customTitel);
  formData.append("format", format);
  formData.append("file", file);

  try {
    const response = await api.post(
      "/bild-manual",
      formData,
      {
        responseType: "blob"
      }
    );

    setImageUrl(URL.createObjectURL(response.data));
    setImageSource("manual");

    setTimeout(() => {
      imageSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);

  } catch (err) {
    handleAxiosError(err);
  } finally {
    setIsLoading(false);
  }
};

  // Hilfsfunktion, um Axios-Fehler sauber zu verarbeiten
const handleAxiosError = (err) => {
  console.error(err);
  if (err.response?.status === 500) {
    setError(null);
    return;
  }

  setError(
    <>
      Es ist ein Fehler aufgetreten. Bitte erneut versuchen oder die{" "}
      <a href="#manuelle-dateneingabe">
        manuelle Dateneingabe
      </a>{" "}
      nutzen.
    </>
  );
};


  // 📡 Daten laden (nur wenn User eingeloggt)
  useEffect(() => {
    if (!user) return;
    setIsLoadingWochen(true);
    setError(null);

    api.get("/wochen")
      .then(res => setWochen(res.data.wochen))
      .catch(handleAxiosError)
      .finally(() => setIsLoadingWochen(false));
  }, [user]);

  const loadTage = (weekId) => {
    setSelectedWeek(weekId);
    setSelectedTag(null);
    setPunkteByTag({});
    setIsLoadingTage(true);
    setIsLoadingPunkte(true);
    setError(null);

    api.get(`/tage?week_id=${encodeURIComponent(weekId)}`)
      .then(res => {
        const tageListe = res.data;

        setTage(tageListe);

        if (tageListe.length === 0) {
          setIsLoadingPunkte(false);
          return;
        }

        let remaining = tageListe.length;

        tageListe.forEach(tag => {
          api.get(`/punkte?tag=${encodeURIComponent(tag.datum)}`)
            .then(res => {
              setPunkteByTag(prev => ({
                ...prev,
                [tag.datum]: res.data
              }));
            })
            .catch(handleAxiosError)
            .finally(() => {
              remaining -= 1;

              if (remaining === 0) {
                setIsLoadingPunkte(false);
              }
            });
        });
      })
      .catch(handleAxiosError)
      .finally(() => {
        setIsLoadingTage(false);
      });
  };


  const handleGenerateButtonClick = async (customTitel = '') => {
    if (!selectedPunkt || !selectedTag) {
      setError("Bitte Tag und Abstimmung auswählen");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(
        "/bild",
        {
          identifier: selectedPunkt,
          tag: selectedTag,
          titel: customTitel,
          format: format
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          responseType: "blob"
        }
      );

      setImageUrl(URL.createObjectURL(response.data));
      setImageSource("normal");

      setTimeout(() => {
        imageSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);

    } catch (err) {
      handleAxiosError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const punkteFürTagGeladen = punkteByTag[selectedTag] !== undefined;

  if (loadingUser) return <div>Lade Benutzer...</div>;

  return (
    <div className="container">
      <div className="header">
        <img src={logo} alt="Logo" className="corner-image" />

        <h1>Sharepic-Generator für Abstimmungen</h1>

        

        {user && (


          <button
            onClick={() => signOut(auth)}
            className="register_btn"
          >
            Logout
          </button>
        )}
      </div>



      {!user && !loadingUser && <Login onLogin={() => setUser(auth.currentUser)} />}

      {user && (
        <>
          <div className="welcome-text">
            <p>
              Der Sharepic-Generator erstellt Sharepics zum Abstimmungsverhalten
              der deutschen Abgeordneten im Europäischen Parlament.
            </p>

            <h3>So funktioniert's:</h3>

            <ol>
              <li>Sitzungswoche auswählen</li>
              <li>Tag auswählen</li>
              <li>Abstimmung auswählen</li>
              <li>Bild generieren</li>
              <li>Bild herunterladen</li>
            </ol>


            <p className="welcome-note">
              <strong>Hinweis:</strong> Manchmal werden die Abstimmungsergebnisse vom
              Europäischen Parlament erst mit Verzögerung veröffentlicht. In diesem
              Fall kann der Generator noch nicht auf die Ergebnisse zugreifen.
            </p>

            <p>
              Sollte dies der Fall sein oder ein anderes Problem auftreten, kann das
              Bild auch über die{" "}
              <a href="#manuelle-dateneingabe">
                <strong>manuelle Dateneingabe</strong>
              </a>{" "}
              erstellt werden.
            </p>
          </div>
          {isLoadingWochen && <div className="loading">Loading...</div>}

          <WochenSelector wochen={wochen} onSelect={loadTage} />

          {isLoadingTage && <div className="loading">Loading...</div>}

          {tage.length > 0 && (
            <TageSelector
              tage={tage}
              selectedTag={selectedTag}
              onSelect={selectTag}
            />
          )}

          {isLoadingPunkte && !punkteFürTagGeladen && (
            <div className="loading">Loading...</div>
          )}

          {selectedTag &&
            punkteFürTagGeladen &&
            punkteByTag[selectedTag].length === 0 && (
              <div className="no-votes-message"
                style={{
                  color: "red",
                  fontSize: "0.85rem",
                  fontStyle: "italic",
                  marginTop: "0.5rem"
                }}>
                <p>
                Keine Abstimmungen für diesen Tag gefunden. (Die Ergebnisse sind
                möglicherweise noch nicht online verfügbar oder an diesem Tag wurden
                keine Roll-Call-Votes durchgeführt.)
                </p>
              </div>
          )}

          {selectedTag && punkteFürTagGeladen && punkteByTag[selectedTag].length > 0 && (
            <PunkteSelector
              punkte={punkteByTag[selectedTag]}
              selectedPunkt={selectedPunkt}
              onPunktSelect={handlePunktSelect}
            />
          )}

          {selectedPunkt && (
            <button
              onClick={() => handleGenerateButtonClick()}
              disabled={isLoading}
            >
              Bild generieren
            </button>
          )}

          {isLoading && (
            <div className="loading">
              Rendering...
            </div>
          )}

          {imageUrl && !isLoading && (
            <>
              <div
                ref={imageSectionRef}
                className={`generated-image-section ${
                  imageSource === "manual" ? "manual-generated" : ""
                }`}
              >
                <h2>Generiertes Bild:</h2>

                {imageSource === "manual" && (
                  <div className="manual-image-notice">
                    Daten aus hochgeladener XML-Datei
                  </div>
                )}

                <div className="image-wrapper">
                  <img
                    src={imageUrl}
                    alt="Abstimmungsergebnis"
                    className="generated-image"
                  />

                  <div className="image-actions">
                    <a
                      href={imageUrl}
                      download="abstimmung.png"
                      className="download-button"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
              
        {/* 
              <div className="advanced-settings">
                <button
                  className="settings-toggle"
                  onClick={() =>
                    setShowAdvancedSettings(prev => !prev)
                  }
                >
                  Erweiterte Einstellungen{" "}
                  {showAdvancedSettings ? "▼" : "▶"}
                </button>

                {showAdvancedSettings && (
                  <div className="settings-content">

                    <TitelInput
                      titel={titel}
                      setTitel={setTitel}
                    />

                    <button
                      onClick={() => {
                        if (imageSource === "manual") {
                          handleManualGenerate(
                            manualFile,
                            manualIdentifier,
                            titel
                          );
                        } else {
                          handleGenerateButtonClick(titel);
                        }
                      }}
                      disabled={
                        isLoading ||
                        (
                          imageSource === "manual" &&
                          (!manualFile || !manualIdentifier)
                        )
                      }
                    >
                      Generate image with settings
                    </button>

                  </div>
                )}
              </div>
              */}
            </>
          )}
          <div id="manuelle-dateneingabe">
                <ManuelleDateneingabe
                  onGenerate={handleManualGenerate}
                  isGenerating={isLoading}
                />
              </div>

        </>
      )}

      {error && (
        <div style={{ color: "red", margin: "10px 0", fontWeight: "bold" }}>
          {error}
        </div>
      )}

      
    </div>
  );
}
export default App;