import React, { forwardRef, useMemo } from 'react';
import Sticker from './Sticker.jsx';

const nailOrder = ['thumb', 'index', 'middle', 'ring', 'pinky'];

const Board = forwardRef(function Board({ app, stickers }, boardRef) {
  const { selectedColor, placements, showHints, showTemplate, nailColors } = app.state;
  const activeTask = app.currentTask;

  const placedStickers = useMemo(
    () => stickers.filter((sticker) => placements[sticker.id]),
    [placements, stickers]
  );

  const templateTargets = useMemo(() => activeTask?.targets ?? [], [activeTask]);

  function getNailFromPointer(event) {
    if (!boardRef?.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const index = clampIndex(Math.floor(xRatio * nailOrder.length));
    return nailOrder[index];
  }

  function clampIndex(idx) {
    if (idx < 0) return 0;
    if (idx >= nailOrder.length) return nailOrder.length - 1;
    return idx;
  }

  function handlePaint(event) {
    const nail = getNailFromPointer(event);
    if (!nail) return;
    app.dispatch({ type: 'paintNail', payload: { nail, color: selectedColor } });
  }

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
          className="paint-layer"
          style={{ maskImage: "url('/mask_nails.png')", WebkitMaskImage: "url('/mask_nails.png')" }}
          onPointerDown={handlePaint}
        >
          {nailOrder.map((nail, index) => (
            <div
              key={nail}
              className="paint-nail"
              style={{
                left: `${(index / nailOrder.length) * 100}%`,
                width: `${100 / nailOrder.length}%`,
                backgroundColor: nailColors[nail] ?? selectedColor
              }}
            />
          ))}
        </div>
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
              taskId={activeTask?.id}
              lockCorrect={app.state.lockCorrect}
            />
          ))}
        </div>
        <div className="board-hints" aria-hidden>
          {showHints
            ? templateTargets.map((hint) => (
                <span
                  key={`${hint.stickerId}-${hint.targetTransform.x}-${hint.targetTransform.y}`}
                  className="hint-dot"
                  style={{
                    left: `${hint.targetTransform.x * 100}%`,
                    top: `${hint.targetTransform.y * 100}%`
                  }}
                />
              ))
            : null}
        </div>
        {showTemplate ? (
          <div className="template-overlay" aria-hidden>
            {templateTargets.map((target) => (
              <div
                key={target.stickerId}
                className="template-ghost"
                style={{
                  left: `${target.targetTransform.x * 100}%`,
                  top: `${target.targetTransform.y * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${target.targetTransform.rotation}deg) scale(${target.targetTransform.scale})`
                }}
              >
                <span>{target.nailName}</span>
              </div>
            ))}
          </div>
        ) : null}
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
