import React, { forwardRef, useMemo, useRef } from 'react';
import { clamp } from '../lib/geometry.js';
import Sticker from './Sticker.jsx';

const VIEWBOX = { width: 612, height: 408 };

const NAILS = [
  { id: 'thumb', shape: { cx: 122, cy: 290, rx: 50, ry: 55, rotation: -8 } },
  { id: 'index', shape: { cx: 220, cy: 235, rx: 48, ry: 60, rotation: -5 } },
  { id: 'middle', shape: { cx: 307, cy: 215, rx: 52, ry: 64, rotation: 0 } },
  { id: 'ring', shape: { cx: 402, cy: 225, rx: 48, ry: 60, rotation: 5 } },
  { id: 'pinky', shape: { cx: 495, cy: 255, rx: 40, ry: 55, rotation: 10 } }
];

const Board = forwardRef(function Board({ app, stickers }, boardRef) {
  const { placements, showHints, showTemplate, nailColors } = app.state;
  const activeTask = app.currentTask;
  const nailMapRef = useRef(null);

  const placedStickers = useMemo(
    () => stickers.filter((sticker) => placements[sticker.id]),
    [placements, stickers]
  );

  const templateTargets = useMemo(() => activeTask?.targets ?? [], [activeTask]);

  function nailHitTest(clientX, clientY) {
    if (!nailMapRef.current) return null;
    const rect = nailMapRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VIEWBOX.width;
    const y = ((clientY - rect.top) / rect.height) * VIEWBOX.height;

    for (const nail of NAILS) {
      const { cx, cy, rx, ry } = nail.shape;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        return { id: nail.id, rect };
      }
    }
    return null;
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(event) {
    event.preventDefault();
    const hit = nailHitTest(event.clientX, event.clientY);
    const color = event.dataTransfer.getData('application/nail-color');
    const stickerId = event.dataTransfer.getData('application/sticker-id');

    if (color) {
      if (!hit) return;
      app.dispatch({ type: 'paintNail', payload: { nail: hit.id, color } });
      return;
    }

    if (!stickerId || !hit || !boardRef?.current) return;
    const sticker = stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const boardX = clamp((event.clientX - boardRect.left) / boardRect.width, 0, 1);
    const boardY = clamp((event.clientY - boardRect.top) / boardRect.height, 0, 1);
    const basePlacement = placements[stickerId] ?? sticker.startTransform ?? {};
    const position = {
      nailId: hit.id,
      x: boardX,
      y: boardY,
      boardX,
      boardY,
      rotation: basePlacement.rotation ?? 0,
      scale: basePlacement.scale ?? sticker.scale ?? 1
    };

    app.dispatch({
      type: 'placeSticker',
      payload: { stickerId: sticker.id, position }
    });

    if (activeTask?.id) {
      app.dispatch({ type: 'finalizePlacement', payload: { stickerId: sticker.id, taskId: activeTask.id } });
    }
  }

  return (
    <div className="board-shell">
      <div
        className="board"
        aria-label="Nail art workspace"
        ref={boardRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className="board-surface"
          style={{ backgroundImage: "url('/bakground.png')" }}
          aria-hidden
        />
        <img className="board-hand" src="/hand.png" alt="Hand with nails" />

        <svg
          ref={nailMapRef}
          className="nail-map"
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ opacity: 0, pointerEvents: 'none' }}
        >
          {NAILS.map((nail) => (
            <ellipse
              key={`${nail.id}-hitbox`}
              cx={nail.shape.cx}
              cy={nail.shape.cy}
              rx={nail.shape.rx}
              ry={nail.shape.ry}
              transform={`rotate(${nail.shape.rotation} ${nail.shape.cx} ${nail.shape.cy})`}
              fill="transparent"
            />
          ))}
        </svg>

        <div className="nails-clip">
          {NAILS.map((nail) => (
            <div
              key={`${nail.id}-polish`}
              className="nail-polish"
              data-nail={nail.id}
              style={{
                left: `${(nail.shape.cx / VIEWBOX.width) * 100}%`,
                top: `${(nail.shape.cy / VIEWBOX.height) * 100}%`,
                width: `${(nail.shape.rx * 2 / VIEWBOX.width) * 100}%`,
                height: `${(nail.shape.ry * 2 / VIEWBOX.height) * 100}%`,
                backgroundColor: nailColors[nail.id] ?? '#f5c1d8',
                transform: `translate(-50%, -50%) rotate(${nail.shape.rotation}deg)`
              }}
            />
          ))}
        </div>

        <div className="sticker-layer">
          {placedStickers.map((sticker) => (
            <Sticker
              key={sticker.id}
              sticker={sticker}
              placement={placements[sticker.id]}
              dispatch={app.dispatch}
              variant="board"
              taskId={activeTask?.id}
              lockCorrect={app.state.lockCorrect}
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
        <div className="tag tone" style={{ backgroundColor: nailColors.thumb ?? '#f5c1d8' }}>
          Vybraná farba
        </div>
      </div>
    </div>
  );
});

export default Board;
