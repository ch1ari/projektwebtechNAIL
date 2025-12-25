import React, { useRef, useState } from 'react';

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
  onSelect,
  boardRef
}) {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });

  const baseScale = placement?.scale ?? sticker.startTransform?.scale ?? sticker.scale ?? 0.6;
  const rotation = placement?.rotation ?? sticker.startTransform?.rotation ?? 0;
  const isBoardPlacement = Boolean(placement) && variant === 'board';

  function handlePointerDown(event) {
    if (variant === 'palette') {
      return;
    }

    if (!placement || !boardRef?.current || !nodeRef.current) return;
    if (lockCorrect && placement?.isCorrect) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = nodeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - centerX,
      offsetY: event.clientY - centerY
    };

    setIsDragging(true);
    nodeRef.current.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!isDragging || !boardRef?.current) return;

    event.preventDefault();

    const boardRect = boardRef.current.getBoundingClientRect();
    const targetCenterX = event.clientX - dragStateRef.current.offsetX;
    const targetCenterY = event.clientY - dragStateRef.current.offsetY;

    const x = (targetCenterX - boardRect.left) / boardRect.width;
    const y = (targetCenterY - boardRect.top) / boardRect.height;

    dispatch({
      type: 'placeSticker',
      payload: {
        stickerId: sticker.id,
        position: { ...placement, x, y }
      }
    });
  }

  function handlePointerUp(event) {
    if (!isDragging) return;

    setIsDragging(false);

    const dist = Math.hypot(
      event.clientX - dragStateRef.current.startX,
      event.clientY - dragStateRef.current.startY
    );

    if (dist < 6) {
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
      return;
    }

    if (!boardRef?.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const isOutside =
      event.clientX < boardRect.left ||
      event.clientX > boardRect.right ||
      event.clientY < boardRect.top ||
      event.clientY > boardRect.bottom;

    if (isOutside) {
      dispatch({ type: 'removeSticker', payload: sticker.id });
      return;
    }

    const targetCenterX = event.clientX - dragStateRef.current.offsetX;
    const targetCenterY = event.clientY - dragStateRef.current.offsetY;

    let x = (targetCenterX - boardRect.left) / boardRect.width;
    let y = (targetCenterY - boardRect.top) / boardRect.height;

    const margin = 0.05;
    x = Math.max(margin, Math.min(1 - margin, x));
    y = Math.max(margin, Math.min(1 - margin, y));

    dispatch({
      type: 'placeSticker',
      payload: {
        stickerId: sticker.id,
        position: { ...placement, x, y }
      }
    });

    if (taskId) {
      dispatch({ type: 'finalizePlacement', payload: { stickerId: sticker.id, taskId } });
    }
  }

  function handleClick(event) {
    if (variant === 'palette') {
      event.preventDefault();
      event.stopPropagation();
      onSelect?.(sticker);
    }
  }

  const style = isBoardPlacement
    ? {
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${baseScale})`,
        touchAction: 'none'
      }
    : {
        transform: `rotate(${rotation}deg) scale(${baseScale})`
      };

  return (
    <div
      ref={nodeRef}
      className={`sticker ${isBoardPlacement ? 'is-placed' : 'is-palette'} ${variant === 'palette' ? 'from-palette' : ''} ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      role="img"
      aria-label={sticker.name}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
    >
      <img src={sticker.img ?? sticker.src} alt={sticker.name} draggable="false" />
    </div>
  );
}
