import React from 'react';
import Sticker from './Sticker.jsx';

export default function Palette({ stickers, placements, dispatch, boardRef }) {
  return (
    <div className="palette">
      <div className="palette-grid">
        {stickers.map((sticker) => (
          <div key={sticker.id} className="palette-item">
            <Sticker
              sticker={sticker}
              placement={placements[sticker.id]}
              dispatch={dispatch}
              boardRef={boardRef}
              variant="palette"
            />
            <div className="palette-meta">
              <span className="name">{sticker.name}</span>
              {placements[sticker.id] ? <span className="status on-board">On board</span> : <span className="status">Ready</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
