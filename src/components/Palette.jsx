import React from 'react';
import Sticker from './Sticker.jsx';

export default function Palette({ stickers, placements, dispatch, boardRef, lockCorrect }) {
  return (
    <div className="palette">
      <div className="palette-row">
        {stickers.map((sticker) => (
          <div key={sticker.id} className="palette-item">
            <Sticker
              sticker={sticker}
              placement={placements[sticker.id]}
              dispatch={dispatch}
              boardRef={boardRef}
              variant="palette"
              lockCorrect={lockCorrect}
            />
            <div className="palette-meta">
              <span className="name">{sticker.name}</span>
              {placements[sticker.id] ? (
                <span className={`status ${placements[sticker.id].isCorrect ? 'correct' : 'on-board'}`}>
                  {placements[sticker.id].isCorrect ? 'Locked' : 'On board'}
                </span>
              ) : (
                <span className="status">Ready</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
