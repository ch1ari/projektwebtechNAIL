import React, { useRef } from 'react';

function normalizeRotation(value) {
  return ((value % 360) + 360) % 360;
}

export default function Sticker({
  sticker,
  placement,
  dispatch,
  variant,
  taskId,
  lockCorrect,
  onSelect
}) {
  const nodeRef = useRef(null);

  const baseScale = placement?.scale ?? sticker.startTransform?.scale ?? sticker.scale ?? 0.6;
  const rotation = placement?.rotation ?? sticker.startTransform?.rotation ?? 0;
  const isBoardPlacement = Boolean(placement) && variant === 'board';

  // Nails-clip bounds relative to board
  const CLIP_BOUNDS = { left: 0.18, top: 0.22, width: 0.64, height: 0.46 };

  function handleDragStart(event) {
    event.dataTransfer.setData('application/sticker-id', sticker.id);
    event.dataTransfer.effectAllowed = isBoardPlacement ? 'move' : 'copy';
  }

  function handleClick() {
    if (variant === 'palette') {
      onSelect?.(sticker);
      return;
    }

    if (!placement) return;
    if (lockCorrect && placement?.isCorrect) return;

    const nextRotation = normalizeRotation((placement.rotation ?? sticker.startTransform?.rotation ?? 0) + 15);
    dispatch({
      type: 'placeSticker',
      payload: {
        stickerId: sticker.id,
        position: { ...placement, rotation: nextRotation }
      }
    });
    if (taskId) {
      dispatch({ type: 'finalizePlacement', payload: { stickerId: sticker.id, taskId } });
    }
  }

  // Convert absolute board coordinates to nails-clip relative coordinates
  const getClipPosition = () => {
    if (!isBoardPlacement) return null;
    const absX = placement.x;
    const absY = placement.y;
    const relX = (absX - CLIP_BOUNDS.left) / CLIP_BOUNDS.width;
    const relY = (absY - CLIP_BOUNDS.top) / CLIP_BOUNDS.height;
    return { x: relX * 100, y: relY * 100 };
  };

  const clipPos = getClipPosition();
  const style = isBoardPlacement
    ? {
        left: `${clipPos.x}%`,
        top: `${clipPos.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${baseScale})`,
        clipPath: placement.nailId ? `url(#clip-${placement.nailId})` : undefined
      }
    : {
        transform: `rotate(${rotation}deg) scale(${baseScale})`
      };

  return (
    <div
      ref={nodeRef}
      className={`sticker ${isBoardPlacement ? 'is-placed' : 'is-palette'} ${variant === 'palette' ? 'from-palette' : ''}`}
      style={style}
      role="img"
      aria-label={sticker.name}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
    >
      <img src={sticker.img ?? sticker.src} alt={sticker.name} draggable="false" />
    </div>
  );
}
