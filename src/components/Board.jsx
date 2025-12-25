import React, { forwardRef, useMemo } from 'react';
import Sticker from './Sticker.jsx';

const VIEWBOX = { width: 612, height: 408 };
const NAIL_PATHS = [
  {
    id: 'thumb',
    d: 'M 218 119 L 219 110 L 220 106 L 221 103 L 224 95 L 229 86 L 231 83 L 236 78 L 237 79 L 239 83 L 241 89 L 242 93 L 243 98 L 243 119 L 242 123 L 239 129 L 236 132 L 234 133 L 231 134 L 225 133 L 223 132 L 220 128 L 219 126 L 218 122 Z'
  },
  {
    id: 'index',
    d: 'M 299 63 L 300 60 L 302 55 L 304 51 L 310 42 L 322 30 L 326 27 L 329 25 L 332 25 L 332 41 L 331 46 L 329 54 L 328 57 L 325 64 L 323 68 L 321 71 L 317 75 L 314 77 L 312 78 L 306 78 L 304 77 L 301 74 L 300 72 L 299 69 Z'
  },
  {
    id: 'middle',
    d: 'M 350 59 L 351 56 L 353 51 L 358 43 L 361 39 L 369 31 L 374 27 L 379 24 L 385 21 L 386 22 L 386 29 L 384 42 L 383 45 L 380 53 L 376 61 L 372 67 L 370 69 L 367 71 L 365 72 L 362 73 L 357 73 L 355 72 L 352 69 L 350 65 Z'
  },
  {
    id: 'ring',
    d: 'M 376 90 L 378 86 L 384 77 L 388 72 L 394 66 L 400 61 L 409 55 L 413 53 L 416 53 L 415 64 L 411 77 L 407 86 L 406 88 L 403 93 L 399 99 L 395 103 L 392 105 L 389 106 L 385 107 L 383 107 L 380 106 L 378 105 L 376 102 Z'
  },
  {
    id: 'pinky',
    d: 'M 390 151 L 392 146 L 395 142 L 400 136 L 401 135 L 408 129 L 413 126 L 423 121 L 427 121 L 427 124 L 426 129 L 423 138 L 419 147 L 415 153 L 411 158 L 409 160 L 406 162 L 402 164 L 396 164 L 394 163 L 391 160 L 390 158 Z'
  }
];

const Board = forwardRef(function Board({ app, stickers }, boardRef) {
  const { selectedColor, placements, showHints, showTemplate, nailColors } = app.state;
  const activeTask = app.currentTask;

  const placedStickers = useMemo(
    () => stickers.filter((sticker) => placements[sticker.id]),
    [placements, stickers]
  );

  const templateTargets = useMemo(() => activeTask?.targets ?? [], [activeTask]);

  function handlePaint(nailId) {
    app.dispatch({ type: 'paintNail', payload: { nail: nailId, color: selectedColor } });
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
          className="nail-hitmap"
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {NAILS.map((nail) => (
            <ellipse
              key={`${nail.id}-hit`}
              className="nail-hit"
              data-nail-id={nail.id}
              cx={nail.shape.cx}
              cy={nail.shape.cy}
              rx={nail.shape.rx}
              ry={nail.shape.ry}
              transform={`rotate(${nail.shape.rotation} ${nail.shape.cx} ${nail.shape.cy})`}
              onClick={() => handlePaint(nail.id)}
            />
          ))}
        </svg>

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
        <div className="tag tone" style={{ backgroundColor: selectedColor }}>
          Vybraná farba: {app.state.selectedColorName ?? 'Neznáma farba'}
        </div>
      </div>
    </div>
  );
});

export default Board;
