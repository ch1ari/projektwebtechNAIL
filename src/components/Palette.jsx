import React from 'react';
import Sticker from './Sticker.jsx';

// Detect touch device
const isTouchDevice = () => {
  return (('ontouchstart' in window) ||
     (navigator.maxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));
};

export default function Palette({ stickers, placements, dispatch, lockCorrect, currentTask, selectedSticker }) {
  const handleSelect = (sticker) => {
    const currentPlacement = placements[sticker.id];
    if (lockCorrect && currentPlacement?.isCorrect) return;

    // On touch devices, just select the sticker for tap-to-place
    if (isTouchDevice()) {
      if (currentPlacement) {
        // If already placed, remove it
        dispatch({ type: 'removeSticker', payload: sticker.id });
        dispatch({ type: 'selectSticker', payload: null });
        return;
      }
      // Select this sticker for placement
      dispatch({ type: 'selectSticker', payload: sticker });
      return;
    }

    // Desktop: auto-place at target position (old behavior)
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
        {stickers.map((sticker) => {
          const isSelected = selectedSticker?.id === sticker.id;
          return (
            <div
              key={sticker.id}
              className={`palette-item ${isSelected ? 'selected' : ''}`}
              style={isSelected ? {
                outline: '3px solid #d946b5',
                borderRadius: '8px',
                backgroundColor: 'rgba(217, 70, 181, 0.1)'
              } : {}}
            >
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
                {isSelected && isTouchDevice() ? (
                  <span className="status" style={{ color: '#d946b5', fontWeight: 'bold' }}>
                    Vybraná ✓
                  </span>
                ) : placements[sticker.id] ? (
                  <span className={`status ${placements[sticker.id].isCorrect ? 'correct' : 'on-board'}`}>
                    {placements[sticker.id].isCorrect ? 'Locked' : 'On board'}
                  </span>
                ) : (
                  <span className="status">Ready</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
