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
                d="m 558.64719,398.0641 c -8.54418,-4.26118 -14.74606,-16.83482 -14.89872,-30.20551 -0.12126,-10.62189 7.01039,-32.00994 16.87938,-50.62179 8.84057,-16.67235 23.71479,-35.5467 35.89485,-45.54807 l 5.69824,-4.67897 1.9729,6.86675 c 7.01233,24.40667 7.36712,58.21143 0.88217,84.05237 -3.72631,14.84837 -5.95728,20.82916 -9.82456,26.33769 -10.13907,14.44206 -24.476,19.84618 -36.60426,13.79753 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>

            {/* Mask for index finger */}
            <mask id="index-mask">
              <path
                d="m 753.66514,260.93418 c -10.75055,-4.98011 -15.22031,-13.29957 -14.54198,-27.06677 0.48233,-9.78927 3.31114,-17.00504 11.44855,-29.20307 12.33172,-18.4853 25.51799,-32.3305 44.18818,-46.3963 15.01672,-11.31333 34.3097,-21.75336 36.06826,-19.51766 0.31341,0.39845 0.0969,5.87354 -0.48109,12.16688 -2.61294,28.44976 -15.11981,61.91632 -33.07664,88.50823 -6.16067,9.12322 -17.00041,18.03457 -25.38883,20.87216 -6.25977,2.11753 -14.40503,2.40214 -18.21645,0.63653 z"
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
