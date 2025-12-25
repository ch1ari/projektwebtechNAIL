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

  const rotation = placement?.rotation ?? sticker.startTransform?.rotation ?? 0;
  const isBoardPlacement = Boolean(placement) && variant === 'board';

  // Separate scales: large for palette, small for board
  const baseScale = isBoardPlacement
    ? (placement?.scale ?? sticker.startTransform?.scale ?? sticker.scale ?? 0.35)
    : 1.0; // Palette stickers are large and visible

  function handleDragStart(event) {
    event.dataTransfer.setData('application/sticker-id', sticker.id);
    event.dataTransfer.effectAllowed = 'copyMove';
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

  const style = isBoardPlacement
    ? {
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${baseScale})`,
        cursor: 'grab',
        pointerEvents: 'auto',
        zIndex: 10
      }
    : {
        transform: `rotate(${rotation}deg) scale(${baseScale})`,
        cursor: 'grab',
        pointerEvents: 'auto'
      };

  function handleDragEnd(event) {
    event.currentTarget.style.cursor = 'grab';
  }

  function handleDragStartWithCursor(event) {
    event.currentTarget.style.cursor = 'grabbing';
    handleDragStart(event);
  }

  return (
    <div
      ref={nodeRef}
      className={`sticker ${isBoardPlacement ? 'is-placed' : 'is-palette'} ${variant === 'palette' ? 'from-palette' : ''}`}
      style={style}
      role="img"
      aria-label={sticker.name}
      draggable={true}
      onDragStart={handleDragStartWithCursor}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <img src={sticker.img ?? sticker.src} alt={sticker.name} draggable="false" />
    </div>
  );
}
