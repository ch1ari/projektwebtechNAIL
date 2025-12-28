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
  onSelect
}) {
  const nodeRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);

  const rotation = placement?.rotation ?? sticker.startTransform?.rotation ?? 0;
  const isBoardPlacement = Boolean(placement) && variant === 'board';

  // Separate scales: large for palette, small for board
  const baseScale = isBoardPlacement
    ? (placement?.scale ?? sticker.startTransform?.scale ?? sticker.scale ?? 0.35)
    : 1.0; // Palette stickers are large and visible

  function handleDragStart(event) {
    // Prevent drag on touch devices (they use pointer events instead)
    if (isDragging) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/sticker-id', sticker.id);
    event.dataTransfer.effectAllowed = 'copyMove';
  }

  function handleClick(event) {
    // Don't trigger click if we just finished a drag
    if (dragStartRef.current) {
      dragStartRef.current = null;
      return;
    }

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

  // Touch/Pointer support for mobile
  function handlePointerDown(event) {
    if (variant === 'palette') {
      setIsDragging(true);
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        stickerId: sticker.id
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event) {
    if (!isDragging || !dragStartRef.current || variant !== 'palette') return;

    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only start actual drag if moved more than 5px (prevents accidental drags)
    if (distance > 5) {
      event.currentTarget.style.cursor = 'grabbing';
    }
  }

  function handlePointerUp(event) {
    if (!isDragging || !dragStartRef.current || variant !== 'palette') return;

    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If moved more than 5px, trigger drop at pointer location
    if (distance > 5) {
      // Find the board element and simulate a drop
      const boardElement = document.querySelector('.board');
      if (boardElement) {
        const boardRect = boardElement.getBoundingClientRect();
        const dropX = event.clientX;
        const dropY = event.clientY;

        // Check if drop is within board bounds
        if (
          dropX >= boardRect.left &&
          dropX <= boardRect.right &&
          dropY >= boardRect.top &&
          dropY <= boardRect.bottom
        ) {
          // Create a custom drop event
          const dropEvent = new DragEvent('drop', {
            clientX: dropX,
            clientY: dropY,
            bubbles: true,
            cancelable: true
          });

          // Set dataTransfer for sticker ID
          Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
              getData: (type) => {
                if (type === 'application/sticker-id') return sticker.id;
                return '';
              }
            }
          });

          boardElement.dispatchEvent(dropEvent);
        }
      }
    } else {
      // If didn't move much, treat as click
      handleClick();
    }

    setIsDragging(false);
    dragStartRef.current = null;
    event.currentTarget.style.cursor = 'grab';
  }

  function handlePointerCancel(event) {
    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    dragStartRef.current = null;
    event.currentTarget.style.cursor = 'grab';
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
    >
      <img src={sticker.img ?? sticker.src} alt={sticker.name} draggable="false" />
    </div>
  );
}
