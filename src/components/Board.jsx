import React, { forwardRef, useMemo, useRef } from 'react';
import Sticker from './Sticker.jsx';

const VIEWBOX = { width: 800, height: 600 };
const NAILS = [
  {
    id: 'thumb',
    shape: { cx: 360, cy: 300, rx: 38, ry: 55, rotation: -12 }
  },
  {
    id: 'index',
    shape: { cx: 455, cy: 215, rx: 28, ry: 45, rotation: -8 }
  },
  {
    id: 'middle',
    shape: { cx: 515, cy: 195, rx: 30, ry: 48, rotation: -4 }
  },
  {
    id: 'ring',
    shape: { cx: 565, cy: 210, rx: 28, ry: 45, rotation: -2 }
  },
  {
    id: 'pinky',
    shape: { cx: 615, cy: 245, rx: 24, ry: 40, rotation: 6 }
  }
];

const Board = forwardRef(function Board({ app, stickers, hoveredNailId }, boardRef) {
  const { selectedColor, placements, showHints, showTemplate, nailColors } = app.state;
  const activeTask = app.currentTask;
  const nailRefs = useRef({});
  const hitmapRef = useRef(null);
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
    const target = document.elementFromPoint(clientX, clientY)?.closest('.nail-hit');
    if (!target) return null;
    const id = target.dataset.nailId;
    const rect = target.getBoundingClientRect();
    return { id, rect };
  }

  function handlePaintPointerDown(event) {
    if (!boardRef?.current) return;
    paintingRef.current = { active: true, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    const hit = nailFromPoint(event.clientX, event.clientY);
    if (hit?.id) handlePaint(hit.id);
  }

  function handlePaintPointerMove(event) {
    const shouldPaint = paintingRef.current.active || event.buttons === 1;
    if (!shouldPaint) return;

    if (!paintingRef.current.active) {
      paintingRef.current = { active: true, pointerId: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const hit = nailFromPoint(event.clientX, event.clientY);
    if (hit?.id) handlePaint(hit.id);
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

        <svg
          className="nail-mask"
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {NAILS.map((nail) => (
              <ellipse
                key={`${nail.id}-mask`}
                id={`nail-${nail.id}`}
                cx={nail.shape.cx}
                cy={nail.shape.cy}
                rx={nail.shape.rx}
                ry={nail.shape.ry}
                transform={`rotate(${nail.shape.rotation} ${nail.shape.cx} ${nail.shape.cy})`}
              />
            ))}
            {NAILS.map((nail) => (
              <clipPath key={`${nail.id}-clip`} id={`clip-${nail.id}`}>
                <use href={`#nail-${nail.id}`} />
              </clipPath>
            ))}
          </defs>
          {NAILS.map((nail) => (
            <g key={`${nail.id}-fill`} clipPath={`url(#clip-${nail.id})`}>
              <rect width="100%" height="100%" fill={nailColors[nail.id] ?? selectedColor} />
            </g>
          ))}
        </svg>

        <svg
          ref={hitmapRef}
          className="nail-hitmap"
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={handlePaintPointerDown}
          onPointerMove={handlePaintPointerMove}
          onPointerUp={handlePaintPointerUp}
          onPointerCancel={handlePaintPointerUp}
        >
          {NAILS.map((nail) => (
            <ellipse
              key={`${nail.id}-hit`}
              className={`nail-hit ${hoveredNailId === nail.id ? 'is-hovered' : ''}`}
              data-nail-id={nail.id}
              cx={nail.shape.cx}
              cy={nail.shape.cy}
              rx={nail.shape.rx}
              ry={nail.shape.ry}
              transform={`rotate(${nail.shape.rotation} ${nail.shape.cx} ${nail.shape.cy})`}
              ref={(node) => {
                if (node) {
                  nailRefs.current[nail.id] = node;
                } else {
                  delete nailRefs.current[nail.id];
                }
              }}
            />
          ))}
        </svg>

        <div className="sticker-layer">
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
              nailHitTest={nailFromPoint}
            />
          ))}
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
