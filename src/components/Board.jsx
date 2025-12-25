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
                d="m 756.6475,256.90573 c -10.86486,-4.72553 -15.52931,-12.93741 -15.17543,-26.71677 0.25164,-9.79791 2.90972,-17.0783 10.75758,-29.4646 11.89293,-18.77061 24.74946,-32.92254 43.08319,-47.42417 14.7461,-11.66387 33.78784,-22.55539 35.59856,-20.36173 0.32272,0.39096 0.23522,5.86963 -0.19439,12.17484 -1.94212,28.5034 -13.65735,62.25525 -30.9829,89.26271 -5.94408,9.26578 -16.57094,18.42996 -24.89019,21.46433 -6.20817,2.26437 -14.34447,2.74074 -18.19642,1.06539 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>

            {/* Mask for middle finger */}
            <mask id="middle-mask">
              <path
                d="m 893.81339,241.79904 c -5.87204,-3.11185 -9.59138,-8.05188 -11.42989,-15.18119 -1.9158,-7.42895 -1.91116,-11.31015 0.0232,-19.48474 3.87287,-16.36628 26.27945,-47.52992 46.73652,-65.00234 13.38669,-11.4336 34.49552,-24.98097 38.91796,-24.97705 1.55078,0.001 0.5263,21.19145 -1.58832,32.85248 -4.80985,26.52378 -17.3186,57.2284 -30.75487,75.49239 -11.5017,15.63432 -29.75983,22.73654 -41.90464,16.30045 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>

            {/* Mask for ring finger */}
            <mask id="ring-mask">
              <path
                d="m 960.3186,333.87444 c -4.02179,-2.08594 -6.27995,-4.1325 -8.50534,-7.70837 -2.84532,-4.572 -3.03162,-5.48213 -3.05954,-14.94683 -0.0386,-13.0996 2.30804,-20.07045 11.37853,-33.80015 20.6532,-31.2621 50.08975,-58.27296 79.55785,-73.00207 3.3704,-1.68463 6.4429,-3.06387 6.8276,-3.06501 1.046,-0.003 -0.3367,13.12353 -2.5799,24.49154 -5.2388,26.54925 -17.1064,55.51762 -32.3558,78.97888 -13.10581,20.16333 -24.62891,28.98167 -40.77245,31.20212 -4.33719,0.59655 -5.75583,0.3058 -10.49095,-2.15011 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>

            {/* Mask for pinky finger */}
            <mask id="pinky-mask">
              <path
                d="m 997.18514,472.35331 c -15.6655,-3.71109 -20.53452,-21.77163 -10.99047,-40.76672 8.37675,-16.67191 35.84933,-42.28011 59.18743,-55.17112 7.1279,-3.93719 22.1541,-10.33522 24.2898,-10.34251 2.5439,-0.009 -0.5676,17.87459 -5.9229,34.04215 -8.2373,24.86912 -28.4389,56.96124 -41.248,65.52673 -8.706,5.8217 -18.3166,8.36956 -25.31586,6.71147 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>
          </defs>

          {/* Render nail polish */}
          {NAILS.map((nail) => {
            if (nail.id === 'thumb' || nail.id === 'index' || nail.id === 'middle' || nail.id === 'ring' || nail.id === 'pinky') {
              // All nails use SVG masks with exact shapes
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
