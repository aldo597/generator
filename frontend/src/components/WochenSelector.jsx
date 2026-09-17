import React, { useState } from 'react';

function WochenSelector({ wochen, onSelect }) {
  const [selectedWeek, setSelectedWeek] = useState(null);

  const handleSelect = (weekId) => {
    setSelectedWeek(weekId);
    onSelect(weekId);
  };

  return (
    <div>
      <h2>1. Sitzungswoche auswählen:</h2>

      <div className="week-options">
        {wochen.map((woche) => (
          <div
            key={woche.id}
            className={`week-item ${
              selectedWeek === woche.id ? 'selected' : ''
            }`}
            onClick={() => handleSelect(woche.id)}
          >
            {woche.woche}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WochenSelector;