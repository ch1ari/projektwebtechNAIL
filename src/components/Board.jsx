// Board Component - Handles nail art workspace and sticker placement
import React, { forwardRef, useMemo, useRef } from 'react';
import { clamp } from '../lib/geometry.js';
import Sticker from './Sticker.jsx';

const VIEWBOX = { width: 612, height: 408 };

// Hit detection areas (larger for easier interaction)
// Note: Visual nails use SVG masks, these are only for hit testing
const NAILS = [
  { id: 'thumb', shape: { cx: 229, cy: 130, rx: 15, ry: 30, rotation: -8 } },
  { id: 'index', shape: { cx: 315, cy: 78, rx: 20, ry: 30, rotation: -5 } },
  { id: 'middle', shape: { cx: 369, cy: 72, rx: 22, ry: 30, rotation: 0 } },
  { id: 'ring', shape: { cx: 397, cy: 106, rx: 24, ry: 32, rotation: 5 } },
  { id: 'pinky', shape: { cx: 409, cy: 167, rx: 22, ry: 26, rotation: 10 } }
];

// Visual nail centers (actual centers from F12 console measurements)
// Calculated from normalized coords: x * 612, y * 408 (VIEWBOX dimensions)
const NAIL_VISUAL_CENTERS = {
  thumb: { x: 230, y: 122 },    // 0.375 * 612, 0.298 * 408
  index: { x: 314, y: 72 },     // 0.513 * 612, 0.176 * 408
  middle: { x: 368, y: 67 },    // 0.602 * 612, 0.165 * 408
  ring: { x: 394, y: 97 },      // 0.644 * 612, 0.237 * 408
  pinky: { x: 408, y: 150 }     // 0.667 * 612, 0.368 * 408
};

// Slovak nail names
const NAIL_NAMES_SK = {
  thumb: 'Palec',
  index: 'Ukazovák',
  middle: 'Prostredník',
  ring: 'Prstenník',
  pinky: 'Malíček'
};

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
      scale: basePlacement.scale ?? sticker.scale ?? 0.35
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
            {/* Individual gradients oriented for each nail's direction */}

            {/* Thumb - angled from bottom-right to top-left */}
            <linearGradient id="thumb-gradient" x1="85%" y1="95%" x2="20%" y2="10%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
              <stop offset="35%" stopColor="rgba(0,0,0,0)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
            </linearGradient>

            {/* Index - from bottom to top, slightly angled right */}
            <linearGradient id="index-gradient" x1="40%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
              <stop offset="30%" stopColor="rgba(0,0,0,0)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
            </linearGradient>

            {/* Middle - straight from bottom to top */}
            <linearGradient id="middle-gradient" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
              <stop offset="30%" stopColor="rgba(0,0,0,0)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
            </linearGradient>

            {/* Ring - from bottom-left to top-right */}
            <linearGradient id="ring-gradient" x1="35%" y1="100%" x2="60%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
              <stop offset="30%" stopColor="rgba(0,0,0,0)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
            </linearGradient>

            {/* Pinky - angled from bottom-left to top-right */}
            <linearGradient id="pinky-gradient" x1="30%" y1="100%" x2="65%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
              <stop offset="35%" stopColor="rgba(0,0,0,0)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
            </linearGradient>

            {/* Subtle glossy shine - visible on all colors */}
            <radialGradient id="nail-shine" cx="40%" cy="20%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Mask for thumb nail */}
            <mask id="thumb-mask">
              <path
                d="m 565.5423,399.32154 c -8.86245,-3.55214 -16.06643,-15.57971 -17.30606,-28.89369 -0.98477,-10.57684 4.3837,-32.47406 12.70624,-51.82693 7.45527,-17.33614 20.74511,-37.35772 32.07138,-48.3166 l 5.29881,-5.12692 2.52485,6.68354 c 8.97416,23.75548 12.07722,57.41939 7.71547,83.70216 -2.50631,15.10224 -4.24345,21.24467 -7.64989,27.04949 -8.93087,15.21885 -22.78077,21.77113 -35.3608,16.72895 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>

            {/* Mask for index finger */}
            <mask id="index-mask">
              <path
                d="m 766.13995,258.47491 c -11.0943,-4.15841 -16.17642,-12.11856 -16.5343,-25.89782 -0.25445,-9.79783 2.02428,-17.20573 9.22229,-29.98062 10.90816,-19.35948 23.01703,-34.15619 40.57775,-49.58486 14.12436,-12.40952 32.57851,-24.26943 34.50004,-22.17216 0.34247,0.37377 0.53789,5.84966 0.43434,12.16863 -0.46822,28.56566 -10.42558,62.87725 -26.33393,90.74303 -5.45785,9.56026 -15.5975,19.26078 -23.74903,22.72053 -6.08301,2.58181 -14.18387,3.47754 -18.11716,2.00327 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>

            {/* Mask for middle finger */}
            <mask id="middle-mask">
              <path
                d="m 891.01794,245.11127 c -5.72177,-3.3802 -9.20857,-8.48702 -10.71526,-15.69376 -1.57004,-7.50963 -1.38583,-11.38646 0.92467,-19.4628 4.62594,-16.16957 28.45036,-46.26315 49.69392,-62.77038 13.90135,-10.802 35.61437,-23.35822 40.03189,-23.14969 1.54907,0.0727 -0.45472,21.1931 -3.1066,32.74381 -6.03187,26.27284 -19.94782,56.36584 -34.21472,73.98862 -12.21273,15.08543 -30.77991,21.3353 -42.61394,14.3442 z"
                fill="white"
                transform="scale(0.3984375)"
              />
            </mask>

            {/* Mask for ring finger */}
            <mask id="ring-mask">
              <path
                d="m 958.71358,332.26942 c -4.02179,-2.08594 -6.27995,-4.1325 -8.50534,-7.70837 -2.84532,-4.572 -3.03162,-5.48213 -3.05954,-14.94683 -0.0386,-13.0996 2.30804,-20.07045 11.37853,-33.80015 20.6532,-31.2621 50.08977,-58.27296 79.55787,-73.00207 3.3704,-1.68463 6.4429,-3.06387 6.8276,-3.06501 1.046,-0.003 -0.3367,13.12353 -2.5799,24.49154 -5.2388,26.54925 -17.1064,55.51762 -32.3558,78.97888 -13.10583,20.16333 -24.62893,28.98167 -40.77247,31.20212 -4.33719,0.59655 -5.75583,0.3058 -10.49095,-2.15011 z"
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
                <g key={`${nail.id}-polish`}>
                  {/* Base nail color */}
                  <rect
                    x="0"
                    y="0"
                    width={VIEWBOX.width}
                    height={VIEWBOX.height}
                    fill={nailColors[nail.id] ?? '#F5E6D3'}
                    mask={`url(#${nail.id}-mask)`}
                    className="nail-polish-svg"
                  />
                  {/* 3D gradient - light at top (fingertip), shadow at bottom (near skin) */}
                  <rect
                    x="0"
                    y="0"
                    width={VIEWBOX.width}
                    height={VIEWBOX.height}
                    fill={`url(#${nail.id}-gradient)`}
                    mask={`url(#${nail.id}-mask)`}
                    className="nail-polish-svg"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Glossy shine spot for realism */}
                  <rect
                    x="0"
                    y="0"
                    width={VIEWBOX.width}
                    height={VIEWBOX.height}
                    fill="url(#nail-shine)"
                    mask={`url(#${nail.id}-mask)`}
                    className="nail-polish-svg"
                    style={{ pointerEvents: 'none', mixBlendMode: 'overlay' }}
                  />
                </g>
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
                  fill={nailColors[nail.id] ?? '#F5E6D3'}
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
            <div className="nail-hints-overlay" style={{ pointerEvents: 'auto' }}>
              {NAILS.map((nail, index) => {
                const targetColor = activeTask?.nailTargets?.[nail.id];
                const targetSticker = templateTargets.find(t => t.nailName === nail.id);
                const stickerData = targetSticker ? activeTask?.stickers?.find(s => s.id === targetSticker.stickerId) : null;

                // Find color name from palette
                const colorName = targetColor ? app.paletteColors.find(c => c.value === targetColor)?.name : null;

                // Use visual nail centers for hint dots
                const center = NAIL_VISUAL_CENTERS[nail.id];
                const posX = (center.x / VIEWBOX.width) * 100;
                const posY = (center.y / VIEWBOX.height) * 100;

                // Determine tooltip position to avoid overlap
                // thumb: show tooltip to the right
                // index, middle, ring, pinky: show tooltip to the left
                let tooltipPosition;
                if (nail.id === 'thumb') {
                  tooltipPosition = 'right';
                } else {
                  tooltipPosition = 'left';
                }

                return (
                  <div
                    key={nail.id}
                    className="nail-hint-dot"
                    data-position={tooltipPosition}
                    style={{
                      left: `${posX}%`,
                      top: `${posY}%`,
                    }}
                  >
                    <div className="hint-tooltip">
                      <div className="hint-tooltip-content">
                        <strong>{NAIL_NAMES_SK[nail.id]}</strong>
                        {targetColor && (
                          <div className="hint-color">
                            <span className="color-dot" style={{ backgroundColor: targetColor }} />
                            <span>{colorName || 'Farba'}</span>
                          </div>
                        )}
                        {stickerData && (
                          <div className="hint-sticker">
                            <img src={stickerData.img ?? stickerData.src} alt={stickerData.name} />
                            <span>{stickerData.name}</span>
                          </div>
                        )}
                        {!targetColor && !stickerData && (
                          <div className="hint-empty">Bez zmeny</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Level and color info overlay */}
        <div className="board-info-overlay">
          <div className="info-card">
            <div className="info-level">
              <span className="info-label">Level:</span>
              <span className="info-value">{activeTask?.title ?? activeTask?.name ?? 'none'}</span>
            </div>
            <div className="info-color">
              <span className="info-label">Farba:</span>
              <div className="info-color-display">
                <span className="color-preview" style={{ backgroundColor: app.state.selectedColor ?? '#f06292' }} />
                <span className="color-name">{app.state.selectedColorName ?? 'Žiadna'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Board;
