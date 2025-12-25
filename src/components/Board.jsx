import React, { forwardRef, useMemo, useRef } from 'react';
import { clamp } from '../lib/geometry.js';
import Sticker from './Sticker.jsx';

const VIEWBOX = { width: 612, height: 408 };

const NAILS = [
  { id: 'thumb', shape: { cx: 229, cy: 130, rx: 12, ry: 27, rotation: -8 } },
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

  // Nail positions as percentages of board
  const getNailPosition = (nail) => {
    return {
      x: (nail.shape.cx / VIEWBOX.width) * 100,
      y: (nail.shape.cy / VIEWBOX.height) * 100
    };
  };

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
          style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}
        >
          <defs>
            {/* Mask for thumb nail */}
            <mask id="thumb-mask">
              <path
                d="m 563.93728,399.32154 c -8.86245,-3.55214 -16.06643,-15.57971 -17.30606,-28.89369 -0.98477,-10.57684 4.3837,-32.47406 12.70624,-51.82693 7.45527,-17.33614 20.74511,-37.35772 32.07138,-48.3166 l 5.29881,-5.12692 2.52485,6.68354 c 8.97416,23.75548 12.07722,57.41939 7.71547,83.70216 -2.50631,15.10224 -4.24345,21.24467 -7.64989,27.04949 -8.93087,15.21885 -22.78077,21.77113 -35.3608,16.72895 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>

            {/* Mask for index finger */}
            <mask id="index-mask">
              <path
                d="m 759.24647,263.50706 c -11.15477,-3.99336 -16.35442,-11.87725 -16.91665,-25.64968 -0.39977,-9.79299 1.76881,-17.23387 8.77654,-30.11413 10.61977,-19.51917 22.50782,-34.49387 39.83774,-50.18134 13.93872,-12.61766 32.2149,-24.75003 34.16735,-22.6815 0.34797,0.36866 0.6246,5.84104 0.61478,12.16086 -0.0444,28.56946 -9.49169,63.02497 -24.98492,91.12368 -5.31545,9.64017 -15.31008,19.49003 -23.40939,23.07033 -6.04404,2.67176 -14.13072,3.68756 -18.08545,2.27178 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>
          </defs>

          {/* Render nail polish */}
          {NAILS.map((nail) => {
            if (nail.id === 'thumb' || nail.id === 'index') {
              // Thumb and index use SVG masks
              return (
                <rect
                  key={`${nail.id}-polish`}
                  x="0"
                  y="0"
                  width={VIEWBOX.width}
                  height={VIEWBOX.height}
                  fill={nailColors[nail.id] ?? '#f5c1d8'}
                  mask={`url(#${nail.id}-mask)`}
                  className="nail-polish-svg"
                />
              );
            } else {
              // Other nails use ellipses for now
              return (
                <ellipse
                  key={`${nail.id}-polish`}
                  cx={nail.shape.cx}
                  cy={nail.shape.cy}
                  rx={nail.shape.rx}
                  ry={nail.shape.ry}
                  transform={`rotate(${nail.shape.rotation} ${nail.shape.cx} ${nail.shape.cy})`}
                  fill={nailColors[nail.id] ?? '#f5c1d8'}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2"
                  className="nail-polish-svg"
                />
              );
            }
          })}
        </svg>

        <div className="nails-clip">{/* Keep for stickers */}

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

          {showHints ? (
            <div className="board-hints" aria-hidden style={{ pointerEvents: 'none' }}>
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
            <div className="template-overlay" aria-hidden style={{ pointerEvents: 'none' }}>
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
        <div className="tag tone" style={{ backgroundColor: nailColors.thumb ?? '#f5c1d8' }}>
          Vybraná farba
        </div>
      </div>
    </div>
  );
});

export default Board;
