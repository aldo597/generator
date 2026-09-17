import React, { useEffect } from 'react';

function TageSelector({ tage, selectedTag, onSelect }) {
  useEffect(() => {
    if (tage.length > 0 && !selectedTag) {
      onSelect(tage[0].datum);
    }
  }, [tage, selectedTag, onSelect]);

  return (
    <div>
      <h2>2. Tag auswählen:</h2>


      <div className="day-options">
        <div
          style={{
            display: 'flex',
            gap: '10px',
            borderBottom: '2px solid #dfe5e1',
            paddingBottom: '5px'
          }}
        >
          {tage.map(tag => (
            <div
              key={tag.id}
              className={`selector-item ${
                selectedTag === tag.datum ? 'selected' : ''
              }`}
              onClick={() => onSelect(tag.datum)}
            >
              {tag.Tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TageSelector;