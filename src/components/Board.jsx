import React, { forwardRef, useMemo, useRef } from 'react';
import Sticker from './Sticker.jsx';

const VIEWBOX = { width: 472, height: 591 };
const NAILS = [
  {
    id: 'thumb',
    shape: { cx: 115, cy: 420, rx: 55, ry: 80, rotation: -20 }
  },
  {
    id: 'index',
    shape: { cx: 205, cy: 280, rx: 44, ry: 88, rotation: -14 }
  },
  {
    id: 'middle',
    shape: { cx: 275, cy: 245, rx: 46, ry: 95, rotation: -8 }
  },
  {
    id: 'ring',
    shape: { cx: 350, cy: 260, rx: 44, ry: 90, rotation: -4 }
  },
  {
    id: 'pinky',
    shape: { cx: 420, cy: 315, rx: 36, ry: 78, rotation: 10 }
  }
];

const Board = forwardRef(function Board({ app, stickers, hoveredNailId }, boardRef) {
  const { selectedColor, placements, showHints, showTemplate, nailColors } = app.state;
  const activeTask = app.currentTask;
  const nailRefs = useRef({});
  const overlayRef = useRef(null);
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
    if (!overlayRef.current) return null;
    const point = overlayRef.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    for (const [nailId, node] of Object.entries(nailRefs.current)) {
      if (!node) continue;
      const ctm = node.getScreenCTM();
      if (!ctm) continue;
      const localPoint = point.matrixTransform(ctm.inverse());
      if (node.isPointInFill(localPoint)) {
        return { id: nailId, rect: node.getBoundingClientRect() };
      }
    }
    return null;
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

        <div
          className="nails-clip"
        >
          <div
            className="paint-layer"
            aria-label="Nail polish layer"
          >
            <svg
              ref={overlayRef}
              className="nail-overlay"
              viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {NAILS.map((nail) => (
                  <ellipse
                    key={`${nail.id}-shape`}
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
                <g key={`${nail.id}-paint`} clipPath={`url(#clip-${nail.id})`}>
                  <rect width="100%" height="100%" fill={nailColors[nail.id] ?? selectedColor} />
                </g>
              ))}

              {NAILS.map((nail) => (
                <use
                  key={`${nail.id}-outline`}
                  href={`#nail-${nail.id}`}
                  className={`nail-shape ${hoveredNailId === nail.id ? 'is-hovered' : ''}`}
                  data-nail-id={nail.id}
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
                  getNailRect={(id) => nailRefs.current[id]?.getBoundingClientRect()}
                />
              ))}
            </div>
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
