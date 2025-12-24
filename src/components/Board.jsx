import React, { forwardRef, useMemo, useRef } from 'react';
import Sticker from './Sticker.jsx';

const nailLayout = [
  { id: 'thumb', left: '12%', top: '58%', width: '16%', height: '26%' },
  { id: 'index', left: '28%', top: '40%', width: '15%', height: '30%' },
  { id: 'middle', left: '45%', top: '34%', width: '16%', height: '32%' },
  { id: 'ring', left: '62%', top: '36%', width: '15%', height: '30%' },
  { id: 'pinky', left: '78%', top: '44%', width: '12%', height: '26%' }
];

const Board = forwardRef(function Board({ app, stickers }, boardRef) {
  const { selectedColor, placements, showHints, showTemplate, nailColors } = app.state;
  const activeTask = app.currentTask;
  const nailRefs = useRef({});
  const paintingRef = useRef({ active: false });

  const placedStickers = useMemo(
    () => stickers.filter((sticker) => placements[sticker.id]),
    [placements, stickers]
  );

  const templateTargets = useMemo(() => activeTask?.targets ?? [], [activeTask]);

  function handlePaint(nailId) {
    app.dispatch({ type: 'paintNail', payload: { nail: nailId, color: selectedColor } });
  }

  function nailFromPoint(clientX, clientY) {
    const entries = Object.entries(nailRefs.current);
    for (const [nailId, node] of entries) {
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return nailId;
      }
    }
    return null;
  }

  function handlePaintPointerDown(event) {
    if (!boardRef?.current) return;
    paintingRef.current = { active: true, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    const nailId = nailFromPoint(event.clientX, event.clientY);
    if (nailId) handlePaint(nailId);
  }

  function handlePaintPointerMove(event) {
    const shouldPaint = paintingRef.current.active || event.buttons === 1;
    if (!shouldPaint) return;

    if (!paintingRef.current.active) {
      paintingRef.current = { active: true, pointerId: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const nailId = nailFromPoint(event.clientX, event.clientY);
    if (nailId) handlePaint(nailId);
  }

  function handlePaintPointerUp(event) {
    if (paintingRef.current.pointerId && event.currentTarget.hasPointerCapture(paintingRef.current.pointerId)) {
      event.currentTarget.releasePointerCapture(paintingRef.current.pointerId);
    }
    paintingRef.current = { active: false };
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
          className="nails-clip"
          style={{
            maskImage: "url('/mask_nails.png')",
            WebkitMaskImage: "url('/mask_nails.png')"
          }}
        >
          <div
            className="paint-layer"
            aria-label="Nail polish layer"
            onPointerDown={handlePaintPointerDown}
            onPointerMove={handlePaintPointerMove}
            onPointerUp={handlePaintPointerUp}
            onPointerCancel={handlePaintPointerUp}
          >
            {nailLayout.map((nail) => {
              const stickersOnNail = placedStickers.filter(
                (sticker) => placements[sticker.id]?.nailId === nail.id
              );
              return (
                <div
                  key={nail.id}
                  className="nail"
                  data-nail-id={nail.id}
                  style={{
                    left: nail.left,
                    top: nail.top,
                    width: nail.width,
                    height: nail.height
                  }}
                  ref={(node) => {
                    if (node) {
                      nailRefs.current[nail.id] = node;
                    } else {
                      delete nailRefs.current[nail.id];
                    }
                  }}
                >
                  <div
                    className="paint-nail"
                    style={{
                      backgroundColor: nailColors[nail.id] ?? selectedColor
                    }}
                  />
                  <div className="sticker-layer">
                    {stickersOnNail.map((sticker) => (
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
                </div>
              );
            })}
          </div>

          {showHints ? (
            <div className="board-hints" aria-hidden>
              {templateTargets.map((hint) => (
                <span
                  key={`${hint.stickerId}-${hint.targetTransform.x}-${hint.targetTransform.y}`}
                  className="hint-dot"
                  style={{
                    left: `${hint.targetTransform.x * 100}%`,
                    top: `${hint.targetTransform.y * 100}%`
                  }}
                />
              ))}
            </div>
          ) : null}

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
      </div>
      <div className="board-footer">
        <div className="tag">Aktívny level: {activeTask?.title ?? activeTask?.name ?? 'none'}</div>
        <div className="tag tone" style={{ backgroundColor: selectedColor }}>
          Vybraná farba: {app.state.selectedColorName ?? 'Neznáma farba'}
        </div>
      </div>
    </div>
  );
});

export default Board;
