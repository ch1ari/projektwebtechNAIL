import React, { forwardRef, useMemo } from 'react';
import Sticker from './Sticker.jsx';

const Board = forwardRef(function Board({ app, stickers }, boardRef) {
  const { selectedColor, placements } = app.state;
  const activeTask = app.currentTask;

  const placedStickers = useMemo(
    () => stickers.filter((sticker) => placements[sticker.id]),
    [placements, stickers]
  );

  return (
    <div className="board-shell">
      <div className="board" aria-label="Nail art workspace" ref={boardRef}>
        <div
          className="board-surface"
          style={{ backgroundImage: "url('/bakground.png')" }}
          aria-hidden
        />
        <img className="board-hand" src="/hand.png" alt="Hand with nails" />
        <div
          className="nails-layer"
          style={{
            backgroundColor: selectedColor,
            maskImage: "url('/mask_nails.png')",
            WebkitMaskImage: "url('/mask_nails.png')",
            pointerEvents: 'none'
          }}
          aria-hidden
        />
        <div
          className="nails-clip"
          style={{
            maskImage: "url('/mask_nails.png')",
            WebkitMaskImage: "url('/mask_nails.png')"
          }}
        >
          {placedStickers.map((sticker) => (
            <Sticker
              key={sticker.id}
              sticker={sticker}
              placement={placements[sticker.id]}
              boardRef={boardRef}
              dispatch={app.dispatch}
              variant="board"
            />
          ))}
        </div>
        <div className="board-hints" aria-hidden>
          {(activeTask?.placements ?? []).map((hint) => (
            <span
              key={`${hint.spot}-${hint.x}-${hint.y}`}
              className="hint-dot"
              style={{ left: `${hint.x * 100}%`, top: `${hint.y * 100}%` }}
            />
          ))}
        </div>
      </div>
      <div className="board-footer">
        <div className="tag">Active task: {activeTask?.name ?? 'none'}</div>
        <div className="tag tone" style={{ backgroundColor: selectedColor }}>
          Selected tone
        </div>
      </div>
    </div>
  );
});

export default Board;
