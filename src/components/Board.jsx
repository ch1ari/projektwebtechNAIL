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
            <mask id="nails-mask">
              {/* Pinky */}
              <path fill="white" d="M 384.5,20.5 C 385.117,20.6107 385.617,20.944 386,21.5C 386.518,38.4501 381.852,53.7834 372,67.5C 367.037,72.7152 361.203,74.2152 354.5,72C 351.5,69.3333 349.833,66 349.5,62C 350.06,57.9855 351.227,54.1521 353,50.5C 357.358,43.2447 362.524,36.7447 368.5,31C 373.727,27.2276 379.061,23.7276 384.5,20.5 Z"/>
              {/* Ring */}
              <path fill="white" d="M 329.5,24.5 C 330.722,27.0616 331.389,29.8949 331.5,33C 331.286,38.5649 330.62,44.0649 329.5,49.5C 328.269,60.8005 323.269,69.9672 314.5,77C 304.656,80.1796 299.323,76.5129 298.5,66C 303.12,47.9385 313.453,34.1052 329.5,24.5 Z"/>
              {/* Middle */}
              <path fill="white" d="M 399.5,97.5 C 397.897,96.3228 396.564,96.4894 395.5,98C 395.957,98.414 396.291,98.914 396.5,99.5C 393.731,101.096 391.397,103.096 389.5,105.5C 384.284,108.385 379.784,107.385 376,102.5C 375.333,98.1667 375.333,93.8333 376,89.5C 384.5,73.6667 396.667,61.5 412.5,53C 413.833,52.3333 415.167,52.3333 416.5,53C 415.157,69.5835 409.49,84.4168 399.5,97.5 Z"/>
              {/* Index */}
              <path fill="white" d="M 235.5,77.5 C 237.136,78.7489 238.303,80.4156 239,82.5C 243.199,94.4894 244.532,106.823 243,119.5C 242.068,127.066 238.068,132.066 231,134.5C 223.04,133.371 218.54,128.705 217.5,120.5C 218.848,104.098 224.848,89.7644 235.5,77.5 Z"/>
              {/* Thumb */}
              <path fill="white" d="M 422.5,121.5 C 423.5,121.5 424.5,121.5 425.5,121.5C 425.448,125.198 425.114,128.865 424.5,132.5C 421.695,144.273 415.695,153.94 406.5,161.5C 401.33,163.093 396.33,162.76 391.5,160.5C 390.778,160.082 390.278,159.416 390,158.5C 389.05,152.066 390.716,146.4 395,141.5C 402.342,132.325 411.508,125.658 422.5,121.5 Z"/>
            </mask>
          </defs>

          {/* Hitboxes for pointer events */}
          {NAILS.map((nail) => (
            <ellipse
              key={`${nail.id}-hitbox`}
              cx={nail.shape.cx}
              cy={nail.shape.cy}
              rx={nail.shape.rx}
              ry={nail.shape.ry}
              transform={`rotate(${nail.shape.rotation} ${nail.shape.cx} ${nail.shape.cy})`}
              fill="transparent"
              className="nail-hitbox"
            />
          ))}

          {/* Nail polish layer with mask applied */}
          <g mask="url(#nails-mask)">
            {NAILS.map((nail) => (
              <ellipse
                key={`${nail.id}-polish`}
                cx={nail.shape.cx}
                cy={nail.shape.cy}
                rx={nail.shape.rx}
                ry={nail.shape.ry}
                transform={`rotate(${nail.shape.rotation} ${nail.shape.cx} ${nail.shape.cy})`}
                fill={nailColors[nail.id] ?? '#f5c1d8'}
                className="nail-polish-svg"
              />
            ))}
          </g>
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
