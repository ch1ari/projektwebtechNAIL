import React from 'react';
import Sticker from './Sticker.jsx';

export default function Palette({ stickers, placements, dispatch, lockCorrect, currentTask }) {
  const handleSelect = (sticker) => {
    const currentPlacement = placements[sticker.id];
    if (lockCorrect && currentPlacement?.isCorrect) return;

    if (currentPlacement) {
      dispatch({ type: 'removeSticker', payload: sticker.id });
      return;
    }

    const target = currentTask?.targets?.find((entry) => entry.stickerId === sticker.id);
    const transform = target?.targetTransform ?? sticker.startTransform ?? {};
    const placement = {
      nailId: target?.nailName ?? transform.nailName ?? null,
      x: transform.x ?? 0.5,
      y: transform.y ?? 0.5,
      boardX: transform.x ?? 0.5,
      boardY: transform.y ?? 0.5,
      rotation: transform.rotation ?? 0,
      scale: transform.scale ?? sticker.scale ?? 1
    };

    dispatch({
      type: 'placeSticker',
      payload: {
        stickerId: sticker.id,
        position: placement
      }
    });

    if (currentTask?.id) {
      dispatch({ type: 'finalizePlacement', payload: { stickerId: sticker.id, taskId: currentTask.id } });
    }
  };

  return (
    <div className="palette">
      <div className="palette-row">
        {stickers.map((sticker) => (
          <div key={sticker.id} className="palette-item">
            <Sticker
              sticker={sticker}
              placement={placements[sticker.id]}
              dispatch={dispatch}
              variant="palette"
              lockCorrect={lockCorrect}
              onSelect={() => handleSelect(sticker)}
            />
            <div className="palette-meta">
              <span className="name">{sticker.name}</span>
              {placements[sticker.id] ? (
                <span className={`status ${placements[sticker.id].isCorrect ? 'correct' : 'on-board'}`}>
                  {placements[sticker.id].isCorrect ? 'Locked' : 'On board'}
                </span>
              ) : (
                <span className="status">Ready</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
